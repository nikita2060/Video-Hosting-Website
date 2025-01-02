import multer from "multer"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null,"./public/temp"); // Set the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});

export const upload = multer({ storage: storage });

// app.post('/upload', upload.single('myFile'), (req, res) => { 
//   // 'myFile' is the name of the input field in your HTML form
//   if (req.file) {
//     console.log(req.file); // Access file information like filename and path
//     res.send('File uploaded successfully!');
//   } else {
//     res.send('No file uploaded.');
//   }
// });

