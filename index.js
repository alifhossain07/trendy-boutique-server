const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // This allows parsing JSON from request body

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_USER_PASSWORD}@basicsexploring.cgr22.mongodb.net/?retryWrites=true&w=majority&appName=basicsExploring`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    const database = client.db("trendyBoutique");
    const trendyBoutique = database.collection("products");
    const cartCollection = database.collection("cart");
    const wishlistCollection = database.collection("wishlist");

    // Get All Products
    app.get("/products", async (req, res) => {
      try {
        const cursor = await trendyBoutique.find();
        const result = await cursor.toArray(); // Convert cursor to array
        res.status(200).json(result); // Send the result back as JSON
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch products", error });
      }
    });
    
    // POST endpoint to add item to cart
    app.post("/cart", async (req, res) => {
      try {
        const { productName, price, image, userEmail } = req.body;

        // Check if the item already exists in the cart for the user
        const existingItem = await cartCollection.findOne({
          productName,
          userEmail,
        });

        if (existingItem) {
          return res
            .status(409)
            .json({ message: "Item already exists in cart" }); // 409 Conflict
        }

        const newCartItem = {
          productName,
          price,
          image,
          userEmail,
          createdAt: new Date(), // Add timestamp if needed
        };
        const result = await cartCollection.insertOne(newCartItem);
        res
          .status(201)
          .json({ message: "Item added to cart", itemId: result.insertedId });
      } catch (error) {
        res.status(500).json({ message: "Failed to add item to cart", error });
      }
    });

    // Get Cart Items based on userEmail
    app.get("/cart", async (req, res) => {
      try {
        const { userEmail } = req.query; // Get userEmail from query parameters
        const cursor = await cartCollection.find({ userEmail }); // Filter by userEmail
        const result = await cursor.toArray(); // Convert cursor to array
        res.status(200).json(result); // Send the result back as JSON
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch cart items", error });
      }
    });

    // POST endpoint to add item to wishlist
    app.post("/wishlist", async (req, res) => {
      try {
        const { productName, price, image, userEmail } = req.body;

        // Check if the item already exists in the wishlist for the user
        const existingItem = await wishlistCollection.findOne({
          productName,
          userEmail,
        });

        if (existingItem) {
          return res
            .status(409)
            .json({ message: "Item already exists in wishlist" }); // 409 Conflict
        }

        const newWishlistItem = {
          productName,
          price,
          image,
          userEmail,
          createdAt: new Date(), // Add timestamp if needed
        };
        const result = await wishlistCollection.insertOne(newWishlistItem);
        res.status(201).json({
          message: "Item added to wishlist",
          itemId: result.insertedId,
        });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to add item to wishlist", error });
      }
    });

    // Get Wishlist Items based on userEmail
    app.get("/wishlist", async (req, res) => {
      try {
        const { userEmail } = req.query; // Get userEmail from query parameters
        const cursor = await wishlistCollection.find({ userEmail }); // Filter by userEmail
        const result = await cursor.toArray(); // Convert cursor to array
        res.status(200).json(result); // Send the result back as JSON
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch wishlist items", error });
      }
    });

    // Log successful connection to MongoDB
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Start the Express server
app.get("/", (req, res) => {
  res.send("Digital Insights Server is Running");
});

app.listen(port, () => {
  console.log(`Digital Insights Server is listening on ${port}`);
});
