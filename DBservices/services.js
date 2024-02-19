const conn = require("../Includes/connection");

async function getUserInfo(payload) {
  const sqlCategory = "SELECT * FROM user_table where user_id=?";

  return new Promise((resolve, reject) => {
    conn.query(sqlCategory, [payload.userId], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}
async function getCategories() {
  const sqlCategory = "SELECT * FROM categories";

  return new Promise((resolve, reject) => {
    conn.query(sqlCategory, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function getAllProducts() {
  const sqlProduct = "SELECT * FROM products";

  return new Promise((resolve, reject) => {
    conn.query(sqlProduct, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function getProductsByProductId(productId) {
  const sqlProduct = "SELECT * FROM products where product_id = ?";

  return new Promise((resolve, reject) => {
    conn.query(sqlProduct, [productId], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function getProductsByCategoryId(categoryId) {
  const sqlProduct = "SELECT * FROM products where category_id = ?";

  return new Promise((resolve, reject) => {
    conn.query(sqlProduct, [categoryId], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function getProductsBySearchTerm(searchTerm) {
  const query = `SELECT * FROM products WHERE product_keywords LIKE '%${searchTerm}%'`;
  return new Promise((resolve, reject) => {
    conn.query(query, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function VerifyData(user_email, user_mobile) {
  const query = `
    SELECT * FROM user_table
    WHERE user_email = ? or user_mobile = ?;
  `;

  try {
    const result = await new Promise((resolve, reject) => {
      conn.query(query, [user_email, user_mobile], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    return result;
  } catch (error) {
    console.error("Error in VerifyData:", error);
    throw error;
  }
}

async function InsertUserData(
  username,
  email,
  imagePath,
  hashedPassword,
  address,
  contact
) {
  const query = `
    INSERT INTO user_table 
    (user_name, user_email, user_password, user_image, user_address, user_mobile) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [username, email, hashedPassword, imagePath, address, contact];

  return new Promise((resolve, reject) => {
    conn.query(query, values, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

async function VerifyEmail(user_email) {
  const userQuery = "SELECT * FROM user_table WHERE user_email = ?;";

  try {
    const result = await new Promise((resolve, reject) => {
      conn.query(userQuery, [user_email], (err, result) => {
        if (err) reject(err);
        else resolve(result || []); // Ensure that result is an array, even if it's falsy
      });
    });

    return result;
  } catch (error) {
    console.error("Error in VerifyData:", error);
    throw error;
  }
}

async function AddCart(product_id, user_id) {
  return new Promise((resolve, reject) => {
    // Check if the product is already in the cart for the user
    const checkSql =
      "SELECT * FROM cart_details WHERE product_id = ? AND user_id = ?";
    conn.query(
      checkSql,
      [product_id, user_id],
      async (checkErr, checkResult) => {
        if (checkErr) {
          console.error("Error checking product in cart:", checkErr);
          reject({ success: false, message: "Internal Server Error" });
        } else {
          if (checkResult.length > 0) {
            // Product is already in the cart, update quantity
            const updateSql =
              "UPDATE cart_details SET quantity = quantity + 1 WHERE product_id = ? AND user_id = ?";
            conn.query(
              updateSql,
              [product_id, user_id],
              (updateErr, updateResult) => {
                if (updateErr) {
                  console.error("Error updating quantity in cart:", updateErr);
                  reject({ success: false, message: "Internal Server Error" });
                } else {
                  console.log("Quantity updated in cart");
                  resolve({
                    success: true,
                    message: "Product quantity updated in cart",
                  });
                }
              }
            );
          } else {
            // Product is not in the cart, insert a new record
            const insertSql =
              "INSERT INTO cart_details (product_id, user_id) VALUES (?, ?)";
            conn.query(
              insertSql,
              [product_id, user_id],
              (insertErr, insertResult) => {
                if (insertErr) {
                  console.error("Error adding product to cart:", insertErr);
                  reject({ success: false, message: "Internal Server Error" });
                } else {
                  console.log("Product added to cart successfully");
                  resolve({
                    success: true,
                    message: "Product added to cart successfully",
                  });
                }
              }
            );
          }
        }
      }
    );
  });
}

async function CalculateTotalAmount(user_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT c.product_id, c.quantity, p.product_price
      FROM cart_details c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.user_id = ?
    `;
    conn.query(sql, [user_id], (err, result) => {
      if (err) {
        console.error("Error calculating total amount:", err);
        reject({ success: false, message: "Internal Server Error" });
      } else {
        // Calculate total amount by summing up quantity * unit price for each product
        const totalAmount = result.reduce((total, item) => {
          return total + item.quantity * item.product_price;
        }, 0);
        resolve({ success: true, totalAmount });
      }
    });
  });
}

async function CalculateTotalQuantity(user_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT SUM(quantity) AS total_quantity
      FROM cart_details
      WHERE user_id = ?
    `;
    conn.query(sql, [user_id], (err, result) => {
      if (err) {
        console.error("Error calculating total quantity:", err);
        reject({ success: false, message: "Internal Server Error" });
      } else {
        const totalQuantity = result[0].total_quantity || 0;
        resolve({ success: true, totalQuantity });
      }
    });
  });
}

async function FetchCartItems(user_id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT c.product_id, c.quantity, p.product_title, p.product_image1, p.product_price
    FROM cart_details c
    JOIN products p ON c.product_id = p.product_id
    WHERE c.user_id = ?`;
    conn.query(sql, [user_id], (err, result) => {
      if (err) {
        console.error("Error Fetching cart items:", err);
        reject({ success: false, message: "Internal Server Error" });
      } else {
        resolve({ success: true, cartItems: result });
      }
    });
  });
}

async function fetchProfileImage(user_id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT user_image
    FROM user_table
    WHERE user_id = ?`;
    conn.query(sql, [user_id], (err, result) => {
      if (err) {
        console.error("Error Fetching image:", err);
        reject({ success: false, message: "Internal Server Error" });
      } else {
        resolve({ success: true, Image: result });
      }
    });
  });
}

async function getPendingOrders(user_id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT count(*) as count
        FROM user_orders
        WHERE user_id = ? and order_status='pending'`;
    conn.query(sql, [user_id], (err, rows) => {
      if (err) {
        console.error("Error Fetching data:", err);
        reject({ success: false, message: "Internal Server Error" });
      } else {
        const pendingOrdersCount = rows[0].count;
        resolve({ success: true, pendingOrdersCount });
      }
    });
  });
}

async function updateQuantityInCart(userId, productId, newQuantity) {
  return conn.query(
    "UPDATE cart_details SET quantity = ? WHERE product_id = ? AND user_id = ?",
    [newQuantity, productId, userId]
  );
}

async function removeItemInCart(userId, productId) {
  return conn.query(
    "DELETE FROM cart_details WHERE product_id = ? AND user_id = ?",
    [productId, userId]
  );
}

async function getUserOrders(user_id) {
  return new Promise((resolve, reject) => {
    const sql = `Select * from user_orders where user_id=? order by order_id desc`;
    conn.query(sql, [user_id], (err, rows) => {
      if (err) {
        console.error("Error Fetching data:", err);
        reject({ success: false, message: "Internal Server Error" });
      } else {
        resolve({ success: true, user_orders: rows });
      }
    });
  });
}

async function cancelUserOrders(order_id) {
  return new Promise((resolve, reject) => {
    const sql = `delete  from user_orders where order_id=?`;
    conn.query(sql, [order_id], (err, rows) => {
      if (err) {
        console.error("Error Canceling data:", err);
        reject({ success: false, message: "Internal Server Error" });
      } else {
        resolve({ success: true, cancel_user_orders: rows });
      }
    });
  });
}

async function updateFormData(formData, userId) {
  return new Promise((resolve, reject) => {
    let sql, params;

    if (formData.user_image) {
      sql = `UPDATE user_table SET user_name=?, user_address=?, user_email=?, user_mobile=?, user_image=? WHERE user_id=?`;
      params = [
        formData.user_username,
        formData.user_address,
        formData.user_email,
        formData.user_mobile,
        formData.user_image,
        userId,
      ];
    } else {
      sql = `UPDATE user_table SET user_name=?, user_address=?, user_email=?, user_mobile=? WHERE user_id=?`;
      params = [
        formData.user_username,
        formData.user_address,
        formData.user_email,
        formData.user_mobile,
        userId,
      ];
    }

    conn.query(sql, params, (err, rows) => {
      if (err) {
        console.error("Error updating data:", err);
        reject({ success: false, message: "Internal Server Error" });
      } else {
        resolve({ success: true, updateFormData: rows });
      }
    });
  });
}
// async function updateFormData(
//   userId,
//   user_name,
//   user_email,
//   user_image,
//   user_address,
//   user_mobile
// ) {
//   return new Promise((resolve, reject) => {
//     let sql, params;

//     if (user_image) {
//       // Assuming user_image is a file object, extract necessary information
//       const { filename, buffer } = user_image;

//       sql = `UPDATE user_table SET user_name=?, user_address=?, user_email=?, user_mobile=?, user_image=? WHERE user_id=?`;
//       params = [
//         user_name,
//         user_address,
//         user_email,
//         user_mobile,
//         buffer,
//         userId,
//       ];
//     } else {
//       sql = `UPDATE user_table SET user_name=?, user_address=?, user_email=?, user_image=? WHERE user_id=?`;
//       params = [user_name, user_address, user_email, userId];
//     }

//     conn.query(sql, params, (err, rows) => {
//       if (err) {
//         console.error("Error updating data:", err);
//         reject({ success: false, message: "Internal Server Error" });
//       } else {
//         resolve({ success: true });
//       }
//     });
//   });
// }

module.exports = {
  getUserInfo,
  getCategories,
  getAllProducts,
  getProductsByProductId,
  getProductsByCategoryId,
  getProductsBySearchTerm,
  VerifyData,
  InsertUserData,
  VerifyEmail,
  AddCart,
  CalculateTotalAmount,
  CalculateTotalQuantity,
  FetchCartItems,
  fetchProfileImage,
  getPendingOrders,
  updateQuantityInCart,
  removeItemInCart,
  getUserOrders,
  cancelUserOrders,
  updateFormData,
};
