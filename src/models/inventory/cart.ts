import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },

    productList: [
      {
        productId: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],

    totalQuantity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, versionKey: false },
);

cartSchema.index({ customerId: 1 });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
