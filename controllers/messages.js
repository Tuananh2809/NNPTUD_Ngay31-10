const Message = require('../schemas/messages');
const mongoose = require('mongoose');

module.exports = {
    getMessagesWithUser: async (req, res) => {
        try {
            let currentUserId = req.user._id;
            let targetUserId = req.params.userID;

            let messages = await Message.find({
                $or: [
                    { from: currentUserId, to: targetUserId },
                    { from: targetUserId, to: currentUserId }
                ]
            }).sort({ createdAt: 1 });

            res.status(200).json(messages);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },

    sendMessage: async (req, res) => {
        try {
            let { to, text } = req.body;
            let from = req.user._id;

            let messageContent = {};

            if (req.file) {
                messageContent.type = 'file';
                messageContent.text = req.file.path;
            } else if (text) {
                messageContent.type = 'text';
                messageContent.text = text;
            } else {
                return res.status(400).send("Phải có nội dung tin nhắn hoặc file đính kèm");
            }

            let newMessage = await Message.create({
                from,
                to,
                messageContent
            });

            res.status(201).json(newMessage);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },

    getLastMessages: async (req, res) => {
        try {
            let currentUserId = req.user._id;

            let messages = await Message.aggregate([
                {
                    $match: {
                        $or: [
                            { from: currentUserId },
                            { to: currentUserId }
                        ]
                    }
                },
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $group: {
                        _id: {
                            $cond: [
                                { $eq: ["$from", currentUserId] },
                                "$to",
                                "$from"
                            ]
                        },
                        lastMessage: { $first: "$$ROOT" }
                    }
                },
                {
                    $replaceRoot: { newRoot: "$lastMessage" }
                },
                {
                    $sort: { createdAt: -1 }
                }
            ]);

            let populatedMessages = await Message.populate(messages, [
                { path: 'from', select: 'username avatarUrl' },
                { path: 'to', select: 'username avatarUrl' }
            ]);

            res.status(200).json(populatedMessages);
        } catch (error) {
            res.status(500).send(error.message);
        }
    }
};