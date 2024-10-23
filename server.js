const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// إعداد multer لحفظ الملفات في مجلد uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

// تأكد من وجود مجلد uploads
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// إعداد المسار الثابت
app.use(express.static(__dirname));

// الاتصال بالـ socket
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('chat message', (msg) => {
        // حفظ الرسالة في ملف messages.txt
        fs.appendFile('messages.txt', msg + '\n', (err) => {
            if (err) throw err;
        });
        io.emit('chat message', msg);
    });

    socket.on('file', (file) => {
        // حفظ الملف في مجلد uploads
        const buffer = Buffer.from(file.data.split(",")[1], 'base64');
        fs.writeFile(path.join('uploads', file.name), buffer, (err) => {
            if (err) throw err;
            console.log(`File ${file.name} saved.`);
            // إرسال إشعار بأن الملف تم حفظه
            io.emit('file', { name: file.name, data: file.data });
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
