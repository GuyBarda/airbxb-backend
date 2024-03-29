const dbService = require('../../services/db.service');
const logger = require('../../services/logger.service');
const utilService = require('../../services/util.service');
const ObjectId = require('mongodb').ObjectId;

async function query(filterBy = { name: '' }) {
    try {
        const criteria = _buildCriteria(filterBy);
        const page = filterBy.page || 0;
        const stayPerPage = 38;
        const collection = await dbService.getCollection('stay');
        const stays = await collection
            .find(criteria)
            .skip(page * stayPerPage)
            .limit(stayPerPage)
            .toArray();

        const length = await collection.countDocuments(criteria);
        return { stays, length };
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
        const stayToSave = JSON.parse(JSON.stringify(stay));
        delete stayToSave._id;
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
    type,
    amenities,
    roomTypes,
    maxPrice,
    minPrice,
    destination,
    guests,
    propertyTypes,
    bathrooms,
    bedrooms,
    beds,
    page,
}) {
    const criteria = {};

    if (name) {
        criteria.name = { $regex: name, $options: 'i' };
    }

    if (type) {
        criteria.type = { $regex: type, $options: 'i' };
    }

    if (amenities && amenities.length) {
        criteria.amenities = {
            $in: amenities.split(',').map((a) => new RegExp(a, 'ig')),
        };
    }

    if (roomTypes && roomTypes.length) {
        criteria.roomType = { $in: roomTypes.split(',') };
    }

    if (maxPrice || minPrice) {
        criteria.price = { $gte: +minPrice || 0, $lte: +maxPrice || Infinity };
    }

    if (destination) {
        criteria['loc.country'] = { $regex: destination, $options: 'i' };
    }

    if (propertyTypes && propertyTypes.length) {
        criteria.proprtyType = { $in: propertyTypes.split(',') };
    }

    if (guests) {
        criteria.capacity = { $gte: +guests };
    }

    if (bathrooms) {
        criteria.bathrooms = { $gte: +bathrooms };
    }

    if (bedrooms) {
        criteria.bedrooms = { $gte: +bedrooms };
    }

    if (beds) {
        criteria.beds = { $gte: +beds };
    }

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
