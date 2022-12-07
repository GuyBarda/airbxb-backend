const dbService = require('../../services/db.service');
const logger = require('../../services/logger.service');
const utilService = require('../../services/util.service');
const ObjectId = require('mongodb').ObjectId;

async function query(filterBy = { name: '' }) {
    try {
        const criteria = _buildCriteria(filterBy);
        const collection = await dbService.getCollection('stay');
        var stays = await collection.find(criteria).toArray();
        return stays;
    } catch (err) {
        logger.error('cannot find stays', err);
        throw err;
    }
}

async function getById(stayId) {
    try {
        const collection = await dbService.getCollection('stay');
        const stay = collection.findOne({ _id: ObjectId(stayId) });
        return stay;
    } catch (err) {
        logger.error(`while finding stay ${stayId}`, err);
        throw err;
    }
}

async function remove(stayId) {
    try {
        const collection = await dbService.getCollection('stay');
        await collection.deleteOne({ _id: ObjectId(stayId) });
        return stayId;
    } catch (err) {
        logger.error(`cannot remove stay ${stayId}`, err);
        throw err;
    }
}

async function add(stay) {
    try {
        const collection = await dbService.getCollection('stay');
        await collection.insertOne(stay);
        return stay;
    } catch (err) {
        logger.error('cannot insert stay', err);
        throw err;
    }
}

async function update(stay) {
    try {
        const stayToSave = {
            vendor: stay.vendor,
            price: stay.price,
        };
        const collection = await dbService.getCollection('stay');
        await collection.updateOne(
            { _id: ObjectId(stay._id) },
            { $set: stayToSave }
        );
        return stay;
    } catch (err) {
        logger.error(`cannot update stay ${stayId}`, err);
        throw err;
    }
}

async function addStayMsg(stayId, msg) {
    try {
        msg.id = utilService.makeId();
        const collection = await dbService.getCollection('stay');
        await collection.updateOne(
            { _id: ObjectId(stayId) },
            { $push: { msgs: msg } }
        );
        return msg;
    } catch (err) {
        logger.error(`cannot add stay msg ${stayId}`, err);
        throw err;
    }
}

async function removeStayMsg(stayId, msgId) {
    try {
        const collection = await dbService.getCollection('stay');
        await collection.updateOne(
            { _id: ObjectId(stayId) },
            { $pull: { msgs: { id: msgId } } }
        );
        return msgId;
    } catch (err) {
        logger.error(`cannot add stay msg ${stayId}`, err);
        throw err;
    }
}

function _buildCriteria({
    name,
    types,
    amenities,
    roomTypes,
    maxPrice,
    minPrice,
    country,
    guests,
}) {
    const criteria = {};

    if (name) {
        criteria.name = { $regex: name, $options: 'i' };
    }

    if (types && types.length) {
        criteria.type = { $in: types.split(',') };
    }

    if (amenities && amenities.length) {
        criteria.amenities = {
            $in: amenities.split(',').map((a) => new RegExp(a, 'ig')),
        };
    }

    if (roomTypes && roomTypes.length) {
        const roomTypesCrit = roomTypes.map((type) => ({
            roomTypes: { $elemMatch: { title: type } },
        }));
        criteria.$and = roomTypesCrit;
    }

    if (maxPrice || minPrice) {
        criteria.price = { $gte: +minPrice || 0, $lte: +maxPrice || Infinity };
    }

    if (country) {
        criteria.loc = { $exists: country };
    }

    if (guests) {
        criteria.capacity = { $gte: +guests };
    }

    console.log(criteria);
    return criteria;
}

module.exports = {
    remove,
    query,
    getById,
    add,
    update,
    addStayMsg,
    removeStayMsg,
};
