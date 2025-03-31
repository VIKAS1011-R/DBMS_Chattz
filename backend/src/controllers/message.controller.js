import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedUserId = req.user.id;
        const Filteredusers = await User
        .find({ _id: { $ne: loggedUserId } }).select('-password -__v');
        res.status(200).json(Filteredusers);
    } catch (error) {
        console.error("Error fetching users for sidebar:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getMessages = async (req, res) => {
    try{
        const {id: userToChatId} = req.params;
        const myId = req.user.id;

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: userToChatId },
                { sender: userToChatId, receiver: myId }
            ]
        }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    }catch (error) {
        console.error("Error fetching messages:", error, "in getMessages middlware");
        res.status(500).json({ message: "Internal server error" });
    }
}

export const sendMessage = async (req, res) => {
    try {
        const {text,image} = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user.id;
        let imageUrl;
        if(image){
            //Upload base64 image to cloudinary and get the url
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });
        await newMessage.save();
        //todo: Realtime functionality goes here ==> socket.io

        //todo: Send notification to the receiver


        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error sending message:", error, "in sendMessage middleware");
        res.status(500).json({ message: "Internal server error" });
    }
}
