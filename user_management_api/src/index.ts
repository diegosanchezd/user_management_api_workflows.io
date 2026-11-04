import Express, { response } from "express";
import { pool } from "./db.js";
const app = Express();
import "dotenv/config";
import { type User } from "./types.js";

const webhookUrl = process.env.WEBHOOK_URL

if (!webhookUrl) {
    throw new Error("SERVICE_URL is not configured");
}

type UserMock = Pick<User, 'name' | 'role' | 'email'>
type UserMockUpdate = Partial<Pick<User, "name" | "email" | "role" | "updated_at">>

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const validRoles  = ["member", "viewer", "admin"]
app.use(Express.json())

// ENDPOINTS
// HEALTH
app.get('/health', async (req, res) => {
    const resultPool = await pool.query("SELECT NOW()");
    console.log(`${resultPool.rows} POOL RESULT`);
    res.send("API is up");
});

// GET USERS
app.get('/users', async (req, res) => {
    const users = await pool.query("SELECT * from users")
    const Users : User[] = users.rows
    res.status(200).json(Users)
})

// CREATE USER
app.post('/users', async (req, res) => {


    if (req.body === null || typeof req.body !== "object") {
        return res.status(400).json("BAD REQUEST");
    }

    const userToSend : UserMock = req.body
    if(typeof userToSend.email != "string" || typeof userToSend.name != "string" || typeof userToSend.role != "string"){
        return res.status(400).json("BAD REQUEST")
    }

    if(userToSend.email.trim() == "" || userToSend.name.trim() == "" 
    || userToSend.role.trim() == "" ){
        return res.status(400).json("BAD REQUEST")
    }

    if( !emailRegex.test(userToSend.email) ){
        return res.status(400).json("BAD REQUEST")
    }

    if( !validRoles.includes(userToSend.role) ){
        return res.status(400).json("BAD REQUEST")
    }

    try {
        const query = await pool.query(`INSERT INTO public.users(name, email, role) VALUES ($1, $2, $3) RETURNING *`,
        [userToSend.name, userToSend.email, userToSend.role])

        res.status(201).json(query.rows)
            try {
                const sendMessage = await fetch(webhookUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "text": `User Creado: ${userToSend.email}`
                    })
                })
            if(!sendMessage.ok){
                const errorMessage = await sendMessage.text();
                const errStatus = sendMessage.status

                console.error("FAILED" , { errStatus , errorMessage } )
            }
          
            } catch (error) {
                console.error("CONNECTION ERROR:", error)
            }
               

    } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error){
            if(error.code == "23505"){
            console.log(error)
            return res.status(409).json("Conflict")
            }
        }

        return res.status(500).json("Internal Server Error")
        
    }
})

// GET USER BY ID
app.get('/users/:id', async (req, res) => {
    const id = Number(req.params.id)

    try {
        const query = await pool.query(`SELECT * FROM users WHERE id = $1`, [id])
         if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json("INVALID ID");
        }
        if(query.rowCount === 0){
            return res.status(404).json("NOT FOUND")
        }
        res.status(200).json(query.rows)
    } catch (error) {
        return res.status(500).json("Internal Server Error")
    }

})

// EDIT USER
app.patch('/users/:id', async (req, res) => {
    const id = Number(req.params.id)
    const userToSend : UserMockUpdate = {...req.body, updated_at: new Date().toISOString()}

     if (req.body === null || typeof req.body !== "object") {
        return res.status(400).json("BAD REQUEST");
    }

     if(userToSend.email != undefined && typeof userToSend.email != "string"){
        return res.status(400).json("BAD REQUEST")
    }if(userToSend.name != undefined && typeof userToSend.name != "string"){
        return res.status(400).json("BAD REQUEST")
    }if(userToSend.role !== undefined && !validRoles.includes(userToSend.role)){
        return res.status(400).json("BAD REQUEST")
    }

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json("INVALID ID");
    }

     if(userToSend.email?.trim() == "" || userToSend.name?.trim() == "" 
    || userToSend.role?.trim() == "" ){
        return res.status(400).json("BAD REQUEST")
    }

    if(userToSend.email && !emailRegex.test(userToSend.email) ){
        return res.status(400).json("BAD REQUEST")
    }

    if( userToSend.role && !validRoles.includes(userToSend.role) ){
        return res.status(400).json("BAD REQUEST")
    }

    try {
        const query = await pool.query(`UPDATE users SET  name= COALESCE($1, name), email=COALESCE($2, email), role=COALESCE($3, role), updated_at=COALESCE($4, updated_at) WHERE id = $5  RETURNING *;`, [userToSend.name, userToSend.email, userToSend.role, userToSend.updated_at, id])

        if(query.rows.length == 0){
             return res.status(404).json("USER NOT FOUND")
        }   

        res.status(200).json("USER UPDATED")

        try {
            const sendMessagePatch = await fetch(webhookUrl, {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify({
                    "text": `USER EDITED ${userToSend.email ? userToSend.email : " "}  ${userToSend.name ? userToSend.name : " "}  ${userToSend.role ? userToSend.role : " "} ${query.rows[0].email}`
                })
            })

            if(!sendMessagePatch.ok){
        
                const errorMessage = await sendMessagePatch.text();
                const errStatus = sendMessagePatch.status

                console.error("FAILED" , { errStatus , errorMessage } )
            }
            
        } catch (error) {
            console.error("CONNECTION ERROR:", error)
        }
    
    } catch (error) {
         if (typeof error === "object" && error !== null && "code" in error){
            if(error.code == "23505"){
            console.log(error)
            return res.status(409).json("Conflict")
            }
        }

        return res.status(500).json("Internal Server Error")
    }
})

// DELETE USER
app.delete('/users/:id', async(req, res) => {
    const id = Number(req.params.id)
    if(!Number.isInteger(id) || id <= 0 ){
        return res.status(400).json("BAD REQUEST")
    }
    try {
        const query = await pool.query(`DELETE FROM users where id = $1 RETURNING *`, [id])
        if(query.rows.length == 0){
            return res.status(404).json("USER NOT FOUND")
        }

        res.status(200).json(query.rows)

        try {
            const userDeleted = await fetch(webhookUrl, {
                method: "POST",
                headers: {
                    "Content-type" : "application/json"
                },
                body: JSON.stringify({
                    "text": `USER DELETED ${query.rows[0].email}`
                })
            })
               if(!userDeleted.ok){
                const errorMessage = await userDeleted.text();
                const errStatus = userDeleted.status

                console.error("FAILED" , { errStatus , errorMessage } )
            }
        } catch (error) {
            console.error("CONNECTION ERROR:", error)
        }

    } catch (error) {
        res.status(500).json("INTERNAL SERVER ERROR")
    }
})

app.listen(3000, () => {
    console.log("SERVER RUNNING ON PORT 3000")
});
