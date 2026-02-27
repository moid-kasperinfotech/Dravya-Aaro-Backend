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
        name: {
          type: String,
          required: true,
        },
        image: {
          type: String,
          required: true,
        },
        price: {
          sellingPrice: {
            type: Number,
            required: true,
            min: 0,
          },
          costPrice: {
            type: Number,
            required: true,
            min: 0,
          },
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        subTotal: {
          type: Number,
          required: true,
          min: 0,
        },
        category: {
          type: String,
          required: true,
        },
      },
    ],

    totalQuantity: {
      type: Number,
      default: 0,
    },

    productCostPriceTotal: {
      type: Number,
      default: 0,
    },

    productSellingPriceTotal: {
      type: Number,
      default: 0,
    },

    shippingCharge: {
      type: Number,
      default: 0,
    },

    gstTax: {
      type: Number,
      default: 0,
    },

    payableAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, versionKey: false },
);

cartSchema.index({ customerId: 1 });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
