const request = require('request');
const {Promise} = require('bluebird');
const uuid = require('uuid').v4;
const Request = require('../model/Request');

const fillPromisesArray = async (iterator)=>{
    let promises = []

    for (let i = 0; i < iterator; i++) {
        promises.push(new Promise(async (resolve, reject)=>{
            const id = uuid()
            return request.get(`http://127.1.1.1:80/campaign/${id}`, {}, (error, response, body)=>{
                try {
                    const parsedBody = JSON.parse(body)
                    resolve({...parsedBody, _id: id})
                } catch (error) {
                    reject(error)
                }
            })
        }))
    }

    return promises
}

const definePromises = async (ids)=>{
    let promises = [];

    for (let id of ids) {
        promises.push(new Promise(async (resolve, reject)=>{
            return request.get(`http://127.1.1.1:80/campaign/${id}`, {}, (error, response, body)=>{
                try {
                    const parsedBody = JSON.parse(body)
                    resolve({...parsedBody, _id: id})
                } catch (error) {
                    reject(error)
                }
            })
        }))
    }

    return promises
}

const updateDB = async (results)=>{
    const successRequests = results.filter(i => i.message).map(i => ({status: i.message, _id: i._id}))
    const failedRequests = results.filter(i => !i.message).map(i => ({status: i.message, _id: i._id}))

    await Request.insertMany(failedRequests, {ordered: false}).catch((error)=>{ console.log(error.toString(), 'just skipping duplicates') })
    await Request.deleteMany({ _id: { $in: successRequests.map(i => i._id.toString()) } }).exec()

    return Request.find({status: false}).exec();
}

const recursive = async (result)=>{
    const failedRequestsFromDB = await updateDB(result);
    const promises = await definePromises(failedRequestsFromDB.map(response => response._id.toString()));
    const allRequestsResults = await Promise.map(promises, async (promise)=>{return promise}, {concurrency: promises.length});

    if (failedRequestsFromDB.length > 0) await recursive(allRequestsResults);
}

const mainAPICall = async (req, res, next)=>{
    const API_CALLS = 10000;

    const promises = await fillPromisesArray(API_CALLS)

    try {
        let results = await Promise.map(promises, async (promise)=>{
            return promise
        }, {concurrency: API_CALLS})

        await recursive(results)

        res.send({
            messages: 'Successfully performed'
        })
        next()
    } catch (error) {
        // There are only one error: "SyntaxError: Unexpected token u in JSON at position 0".
        // It's caused by EADDRINUSE error. (Port already in use).
        // To clear performing ensure that you haven't any processes on server port.
        console.log(error)
        res.status(500)
        res.send({
            success: false,
            errors: error.toString(),
            data: null
        })
        next()
    }
}

module.exports = {
    mainAPICall
}