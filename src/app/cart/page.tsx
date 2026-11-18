
"use client";

import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";

import type { RootState, AppDispatch } from "@/lib/store";

import {
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
} from "@/lib/cartSlice";

export default function CartPage() {
  const dispatch = useDispatch<AppDispatch>();

  // Get cart items from Redux
  const cartItems = useSelector(
    (state: RootState) => state.cart.items
  );

  // Calculate total quantity
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Calculate total price
  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        <h1 className="mb-8 text-3xl font-bold text-gray-800">
          Shopping Cart
        </h1>

        {cartItems.length === 0 ? (

          // Empty Cart
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <h2 className="text-2xl font-bold">
              Your Cart is Empty
            </h2>

            <p className="mt-3 text-gray-500">
              Add some products to start shopping.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              Continue Shopping
            </Link>
          </div>

        ) : (

          // Cart with Products
          <div className="grid gap-8 md:grid-cols-3">

            {/* Product List */}
            <section className="space-y-5 md:col-span-2">

              {cartItems.map((item) => (

                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-5 rounded-xl bg-white p-6 shadow"
                >

                  {/* Product Details */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {item.name}
                    </h2>

                    <p className="mt-2 text-blue-600">
                      ₹{item.price.toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">

                    <button
                      onClick={() =>
                        dispatch(decreaseQuantity(item.id))
                      }
                      disabled={item.quantity <= 1}
                      className="rounded bg-gray-200 px-4 py-2 disabled:opacity-40"
                    >
                      -
                    </button>

                    <span className="font-semibold">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        dispatch(increaseQuantity(item.id))
                      }
                      className="rounded bg-gray-200 px-4 py-2"
                    >
                      +
                    </button>

                  </div>

                  {/* Subtotal */}
                  <p className="font-bold">
                    ₹{(
                      item.price * item.quantity
                    ).toLocaleString("en-IN")}
                  </p>

                  {/* Remove Button */}
                  <button
                    onClick={() =>
                      dispatch(removeFromCart(item.id))
                    }
                    className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  >
                    Remove
                  </button>

                </div>

              ))}

            </section>

            {/* Order Summary */}
            <section className="h-fit rounded-xl bg-white p-6 shadow">

              <h2 className="mb-6 text-2xl font-bold">
                Order Summary
              </h2>

              <div className="flex justify-between">
                <span>Total Items</span>
                <span>{totalItems}</span>
              </div>

              <div className="mt-4 flex justify-between text-xl font-bold text-blue-600">
                <span>Total Price</span>
                <span>
                  ₹{totalPrice.toLocaleString("en-IN")}
                </span>
              </div>

              <Link
                href="/checkout"
                className="mt-8 block rounded-lg bg-blue-600 py-3 text-center font-semibold text-white hover:bg-blue-700"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="mt-4 block text-center text-blue-600 hover:underline"
              >
                Continue Shopping
              </Link>

            </section>

          </div>
        )}

      </div>
    </main>
  );
}
