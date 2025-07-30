import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url"; 
import methodOverride from "method-override";

const app=express();
const port=3000;

const _filename= fileURLToPath(import.meta.url);
const _dirname= path.dirname(_filename);


const db=new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"Book",
    password:"Rashan2005@",
    port:5432,
});

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));

db.connect();

app.get("/", async(req,res)=>{
    const book=await db.query("SELECT * FROM book_details");
    res.render("index.ejs",{book:book.rows});
})
app.get("/book",async(req,res)=>{
     const id=req.query.id;
     const book_details=await db.query("SELECT * FROM book_details WHERE id=$1",[id]);
     const book_notes=await db.query("SELECT * FROM book_notes WHERE book_id=$1",[id]);
     const notes=book_notes.rows.length>0?book_notes.rows[0]:null;
    res.render("new.ejs",{b:book_details.rows[0],n:notes});
})

app.delete("/delete",async (req,res)=>{
    const id=req.query.id;
    await db.query("DELETE FROM book_details WHERE id=$1",[id]);
    res.redirect("/");
})

app.post("/post",async (req,res)=>{
    const id=parseInt(req.query.id,10);
    const { title, isbn, rating , author,note} = req.body;
    try{
        if (id){
            await db.query("UPDATE book_details SET title=$1, isbn=$2 , author=$3 WHERE id=$4",[title,isbn,author,id]);
            await db.query("UPDATE book_notes SET rating=$1,note=$2 WHERE book_id=$3",[rating,note,id]);
        }
        else{
            const result=await db.query("INSERT INTO book_details (title,author,isbn) VALUES ($1,$2,$3) RETURNING id",[title,author,isbn]);
            const newId=result.rows[0].id;

            await db.query("INSERT INTO book_notes (book_id,rating,note) VALUES ($1,$2,$3)",[newId,rating,note]);
        }
        res.redirect("/")
    }
    catch (err){
        console.error(err);
        res.status(500).send("Database error"); 
    }
})

app.get("/new",(req,res)=>{
    res.render("new.ejs",{n:null});
})

app.listen(port,()=>{
    console.log(`your app is running on port:${port}`);
})