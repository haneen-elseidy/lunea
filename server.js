const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;
const ADMIN_PASSWORD = 'admin';
const imagesDir = path.join(__dirname, 'statics/images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}
app.use(express.json());
const requireHeaderAuth = (req, res, next) => {
    const pass = req.headers['x-admin-password'];
    if (pass === ADMIN_PASSWORD) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });
};
app.use(express.static(path.join(__dirname)));
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, imagesDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
app.post('/api/verify', requireHeaderAuth, (req, res) => {
    res.json({ success: true });
});
app.post('/api/products', requireHeaderAuth, (req, res) => {
    try {
        fs.writeFileSync(path.join(__dirname, 'products.json'), JSON.stringify(req.body, null, 2));
        res.json({ success: true, message: 'تم التحديث بنجاح' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء الحفظ' });
    }
});
app.post('/api/upload', requireHeaderAuth, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'لم يتم رفع أي صورة' });
        }
        const imagePath = 'statics/images/' + req.file.filename;
        res.json({ success: true, imagePath: imagePath });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'فشل رفع الصورة' });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`👉 Main Website: http://localhost:${PORT}/index.html`);
    console.log(`⚙️  Dashboard: http://localhost:${PORT}/dashboard.html`);
});
