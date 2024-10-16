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
    const usersCollection = database.collection("users");

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
          return res.status(409).json({ message: "Item already exists in cart" }); // 409 Conflict
        }

        const newCartItem = {
          productName,
          price,
          image,
          userEmail,
          createdAt: new Date(), // Add timestamp if needed
        };
        const result = await cartCollection.insertOne(newCartItem);
        res.status(201).json({ message: "Item added to cart", itemId: result.insertedId });
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
          return res.status(409).json({ message: "Item already exists in wishlist" }); // 409 Conflict
        }

        const newWishlistItem = {
          productName,
          price,
          image,
          userEmail,
          createdAt: new Date(), // Add timestamp if needed
        };
        const result = await wishlistCollection.insertOne(newWishlistItem);
        res.status(201).json({ message: "Item added to wishlist", itemId: result.insertedId });
      } catch (error) {
        res.status(500).json({ message: "Failed to add item to wishlist", error });
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

    // Express route for removing an item from the cart
    app.delete("/cart", async (req, res) => {
      const { userEmail, productId } = req.query;
      try {
        // Convert productId to ObjectId
        const result = await cartCollection.deleteOne({
          userEmail,
          _id: new ObjectId(productId),
        });

        if (result.deletedCount === 1) {
          res.status(200).json({ message: "Item removed from cart" });
        } else {
          res.status(404).json({ message: "Item not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error removing item from cart", error });
      }
    });

    // Express route for removing an item from the wishlist
    app.delete("/wishlist", async (req, res) => {
      const { userEmail, productId } = req.query; // Changed to use productId
      try {
        const result = await wishlistCollection.deleteOne({
          userEmail,
          _id: new ObjectId(productId), // Ensure ObjectId is used for productId
        });
        if (result.deletedCount === 1) {
          res.status(200).json({ message: "Item removed from wishlist" });
        } else {
          res.status(404).json({ message: "Item not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error removing item from wishlist", error });
      }
    });

    // Express route for updating a product in the database
    app.put("/products/:id", async (req, res) => {
      const productId = req.params.id;
      const updatedProduct = req.body;

      try {
        const result = await trendyBoutique.updateOne(
          { _id: new ObjectId(productId) }, // Find the product by ID
          { $set: updatedProduct } // Set the updated fields
        );

        if (result.modifiedCount === 1) {
          res.status(200).json({ message: "Product updated successfully" });
        } else {
          res.status(404).json({ message: "Product not found or no changes made" });
        }
      } catch (error) {
        res.status(500).json({ message: "Error updating product", error });
      }
    });

    // DELETE endpoint for removing a product
    app.delete("/products/:id", async (req, res) => {
      const productId = req.params.id;

      try {
        // Ensure the ID is a valid ObjectId
        if (!ObjectId.isValid(productId)) {
          return res.status(400).json({ error: "Invalid product ID" });
        }

        // Delete the product from the database
        const result = await trendyBoutique.deleteOne({ _id: new ObjectId(productId) });

        // Check if a document was deleted
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Product not found" });
        }

        res.status(200).json({ message: "Product deleted successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while deleting the product" });
      }
    });

    // POST endpoint to add a new product
    app.post("/products",  async (req, res) => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
          }
      try {
        // Extract product data from request body
        const {
          productName,
          image,
          category,
          subcategory,
          price,
          discount,
          rating,
          details,
          adminEmail,
          isStock,
          productQuantity,
          isDiscount,
        } = req.body;

        // Create a new product object
        const newProduct = {
          productName,
          image,
          category,
          subcategory,
          price: parseFloat(price), // Convert price to a number
          discount,
          rating: parseFloat(rating), // Convert rating to a number
          details,
          adminEmail,
          isStock: isStock === true, // Ensure boolean
          productQuantity: parseInt(productQuantity), // Convert to number
          isDiscount: isDiscount === true, // Ensure boolean
          createdAt: new Date(), // Optional: Add creation date
        };

        // Insert new product into the collection
        const result = await trendyBoutique.insertOne(newProduct);

        // Respond with success and the inserted product's ID
        res.status(201).json({
          message: "Product added successfully!",
          productId: result.insertedId,
        });
      } catch (error) {
        // Handle errors and respond with an error message
        res.status(500).json({ message: "Failed to add product", error });
      }
    });
    // User Registration Endpoint
app.post("/register", async (req, res) => {
    const { email, name, photoURL } = req.body;
  
    const newUser = { email, name, photoURL, role: 'user' }; // Default role
  
    try {
      await usersCollection.insertOne(newUser);
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      res.status(500).json({ message: "Registration failed", error });
    }
  });
  
  // User Login Endpoint
  app.post("/login", async (req, res) => {
    const { email } = req.body;
  
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email" });
    }   

  });

//   Payment API Post API

// app.post("/order", async (req, res) => {
//     // Extract order details from the request body
//     const {
//         fullName,
//         email,
//         userAddress,
//         userCity,
//         zipCode,
//         totalPrice,
//         products,
//         phoneNumber,
//     } = req.body;

//     const productDetails = products.map(item => {
//         return `Product ID: ${item.productId}, Quantity: ${item.quantity}`;
//     }).join("; ");

//     const data = {
//         total_amount: parseFloat(totalPrice), // Ensure this is a number
//         currency: 'BDT',
//         tran_id: `REF${Date.now()}`, // Use a unique tran_id for each API call
//         success_url: 'http://localhost:3030/success',
//         fail_url: 'http://localhost:3030/fail',
//         cancel_url: 'http://localhost:3030/cancel',
//         ipn_url: 'http://localhost:3030/ipn',
//         shipping_method: 'Courier',
//         product_name: productDetails, // Combine product IDs as a string
//         cus_name: fullName,
//         cus_email: email,
//         cus_phone: phoneNumber,
//         cus_postcode: zipCode,
//         cus_city: userCity, // Include city for billing
//         ship_name: fullName,
//         ship_address: userAddress, // Add shipping address
//         ship_city: userCity, // Add shipping city
//         ship_postcode: zipCode, // Add shipping postcode
//         ship_country: 'Bangladesh', // Specify country
//         ship_add1: userAddress, // Add shipping address line 1
//         ship_add2: '', // Optional: additional shipping address line
//         ship_country: 'Bangladesh', // Ensure country is specified
//         ship_phone: phoneNumber, // Add shipping phone number
//         // Additional fields based on SSLCommerz requirements
//         // ship_state: '', // Optional: state
//         // ship_district: '', // Optional: district
//     };

//     const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

//     try {
//         const apiResponse = await sslcz.init(data);
//         console.log('API Response:', apiResponse); // Log the API response

//         if (apiResponse.GatewayPageURL) {
//             let GatewayPageURL = apiResponse.GatewayPageURL;
//             res.json({ paymentUrl: GatewayPageURL }); // Send the payment URL back to the client
//             console.log('Redirecting to: ', GatewayPageURL);
//         } else {
//             res.status(500).json({ error: "Unable to get payment URL" });
//         }
//     } catch (error) {
//         console.error("SSLCommerz initialization error:", error);
//         res.status(500).json({ error: "Payment initialization failed" });
//     }
// });





    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensure that the client will close when you finish/error
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
