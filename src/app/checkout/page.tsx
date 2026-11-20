
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/lib/store";
import { clearCart } from "@/lib/cartSlice";

interface OrderResponse {
  success: boolean;
  message: string;
  orderId?: number;
  totalAmount?: string;
}

export default function CheckoutPage() {
  const dispatch = useDispatch<AppDispatch>();

  const cartItems = useSelector(
    (state: RootState) => state.cart.items
  );

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (cartItems.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          items: cartItems.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const result: OrderResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to place your order."
        );
      }

      dispatch(clearCart());
      setOrderSuccess(true);

      setMessage(
        `Order placed successfully! Your Order ID is #${result.orderId}. Total: ₹${Number(result.totalAmount).toLocaleString("en-IN")}`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Empty Cart
  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 text-center shadow dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 text-6xl">🛒</div>

          <h1 className="text-3xl font-bold">
            Your Cart is Empty
          </h1>

          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Add products before proceeding to checkout.
          </p>

          <Link
            href="/products"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  // Order Success
  if (orderSuccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
        <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 text-6xl">✅</div>

          <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
            Order Placed Successfully!
          </h1>

          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Thank you for shopping with ShopEase.
          </p>

          <p className="mt-4 rounded-lg bg-green-50 p-4 font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
            {message}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/orders"
              className="rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              View My Orders
            </Link>

            <Link
              href="/products"
              className="rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-6xl">

        {/* Page Heading */}
        <h1 className="mb-8 text-3xl font-bold text-gray-800 dark:text-white">
          Checkout
        </h1>

        <div className="grid gap-8 md:grid-cols-2">

          {/* Order Summary */}
          <section className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow dark:border-gray-800 dark:bg-gray-900">

            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
              Order Summary
            </h2>

            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-4 border-b border-gray-200 py-4 dark:border-gray-700"
              >
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {item.name}
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Quantity: {item.quantity}
                  </p>
                </div>

                <p className="font-semibold text-gray-900 dark:text-white">
                  ₹{(
                    item.price * item.quantity
                  ).toLocaleString("en-IN")}
                </p>
              </div>
            ))}

            <div className="mt-6 flex justify-between text-gray-700 dark:text-gray-300">
              <span>Total Items</span>
              <span>{totalItems}</span>
            </div>

            <div className="mt-4 flex justify-between text-xl font-bold text-blue-600 dark:text-blue-400">
              <span>Estimated Total</span>
              <span>
                ₹{totalPrice.toLocaleString("en-IN")}
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Final amount is calculated using database prices.
            </p>

            <Link
              href="/cart"
              className="mt-6 inline-block font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              ← Back to Cart
            </Link>
          </section>

          {/* Delivery Information */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow dark:border-gray-800 dark:bg-gray-900">

            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
              Delivery Information
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Full Name */}
              <div>
                <label className="mb-2 block font-medium text-gray-800 dark:text-gray-200">
                  Full Name
                </label>

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block font-medium text-gray-800 dark:text-gray-200">
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block font-medium text-gray-800 dark:text-gray-200">
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                  pattern="[0-9]{10}"
                  title="Enter a 10-digit phone number"
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              {/* Delivery Address */}
              <div>
                <label className="mb-2 block font-medium text-gray-800 dark:text-gray-200">
                  Delivery Address
                </label>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your complete delivery address"
                  rows={4}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isLoading ? "Placing Order..." : "Place Order"}
              </button>

              {/* Error Message */}
              {message && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                >
                  {message}
                </p>
              )}

            </form>
          </section>

        </div>
      </div>
    </main>
  );
}
