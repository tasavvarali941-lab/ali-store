const express=require("express"), path=require("path"), fs=require("fs");
const multer=require("multer"), bcrypt=require("bcryptjs"), jwt=require("jsonwebtoken");
const Database=require("better-sqlite3"), cors=require("cors");
const app=express(), PORT=process.env.PORT||3000, SECRET=process.env.JWT_SECRET||"CHANGE_THIS_SECRET";
const ROOT=__dirname, UP=path.join(ROOT,"uploads");
for(const d of ["apks","icons","screenshots"])fs.mkdirSync(path.join(UP,d),{recursive:true});
const db=new Database(path.join(ROOT,"ali-store.db"));
db.exec(`CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY,email TEXT UNIQUE,password TEXT);
CREATE TABLE IF NOT EXISTS apps(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,description TEXT,category TEXT,version TEXT,apk TEXT,icon TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS reviews(id INTEGER PRIMARY KEY AUTOINCREMENT,app_id INTEGER,rating INTEGER,review TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
if(!db.prepare("SELECT 1 FROM admins LIMIT 1").get()){
  const email=process.env.ADMIN_EMAIL||"admin@alystore.app", pass=process.env.ADMIN_PASSWORD||"AliStore@123";
  db.prepare("INSERT INTO admins(email,password) VALUES(?,?)").run(email,bcrypt.hashSync(pass,10));
  console.log("Admin:",email," Password:",pass);
}
app.use(cors()); app.use(express.json()); app.use(express.static(path.join(ROOT,"public")));
app.use("/uploads",express.static(UP));
const upload=multer({storage:multer.diskStorage({
 destination:(req,file,cb)=>cb(null,path.join(UP,file.fieldname==="apk"?"apks":file.fieldname==="icon"?"icons":"screenshots")),
 filename:(req,file,cb)=>cb(null,Date.now()+"-"+file.originalname.replace(/[^a-zA-Z0-9._-]/g,"_"))
}),limits:{fileSize:1024*1024*1024}});
function auth(req,res,next){try{req.admin=jwt.verify((req.headers.authorization||"").replace("Bearer ",""),SECRET);next()}catch(e){res.status(401).json({error:"Admin login required"})}}
app.post("/api/login",(req,res)=>{const a=db.prepare("SELECT * FROM admins WHERE email=?").get(req.body.email);if(!a||!bcrypt.compareSync(req.body.password,a.password))return res.status(401).json({error:"Invalid login"});res.json({token:jwt.sign({id:a.id,email:a.email},SECRET,{expiresIn:"7d"})})});
app.get("/api/apps",(req,res)=>res.json(db.prepare("SELECT * FROM apps ORDER BY id DESC").all()));
app.get("/api/apps/:id",(req,res)=>{const a=db.prepare("SELECT * FROM apps WHERE id=?").get(req.params.id);if(!a)return res.sendStatus(404);const reviews=db.prepare("SELECT * FROM reviews WHERE app_id=? ORDER BY id DESC").all(a.id);res.json({...a,reviews})});
app.post("/api/apps",auth,upload.fields([{name:"apk",maxCount:1},{name:"icon",maxCount:1},{name:"screenshots",maxCount:8}]),(req,res)=>{
 const f=req.files||{}, apk=f.apk?.[0], icon=f.icon?.[0];
 if(!apk)return res.status(400).json({error:"APK required"});
 if(!apk.originalname.toLowerCase().endsWith(".apk"))return res.status(400).json({error:"Only APK files allowed"});
 const url="/uploads/apks/"+path.basename(apk.path), iconUrl=icon?"/uploads/icons/"+path.basename(icon.path):"";
 const info=db.prepare("INSERT INTO apps(name,description,category,version,apk,icon) VALUES(?,?,?,?,?,?)").run(req.body.name,req.body.description,req.body.category,req.body.version,url,iconUrl);
 res.json({id:info.lastInsertRowid,message:"Published"});
});
app.post("/api/apps/:id/reviews",(req,res)=>{let r=Math.max(1,Math.min(5,Number(req.body.rating)||5));db.prepare("INSERT INTO reviews(app_id,rating,review) VALUES(?,?,?)").run(req.params.id,r,String(req.body.review||""));res.json({ok:true})});
app.delete("/api/apps/:id",auth,(req,res)=>{db.prepare("DELETE FROM apps WHERE id=?").run(req.params.id);res.json({ok:true})});
app.get("*",(req,res)=>res.sendFile(path.join(ROOT,"public","index.html")));
app.listen(PORT,()=>console.log("Ali Store running on http://localhost:"+PORT));
