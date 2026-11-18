
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

  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 text-center shadow">
          <h1 className="text-3xl font-bold">
            Your Cart is Empty
          </h1>

          <p className="mt-3 text-gray-600">
            Add products before proceeding to checkout.
          </p>

          <Link
            href="/products"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  if (orderSuccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-lg rounded-xl bg-white p-8 text-center shadow">
          <div className="mb-4 text-6xl">✅</div>

          <h1 className="text-3xl font-bold text-green-600">
            Order Placed Successfully!
          </h1>

          <p className="mt-4 text-gray-600">
            Thank you for shopping with ShopEase.
          </p>

          <p className="mt-4 rounded-lg bg-green-50 p-4 font-semibold text-green-700">
            {message}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/orders"
              className="rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
            >
              View My Orders
            </Link>

            <Link
              href="/products"
              className="rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 hover:bg-gray-100"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-800">
          Checkout
        </h1>

        <div className="grid gap-8 md:grid-cols-2">
          <section className="h-fit rounded-xl bg-white p-6 shadow">
            <h2 className="mb-6 text-2xl font-bold">
              Order Summary
            </h2>

            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-4 border-b py-4"
              >
                <div>
                  <h3 className="font-semibold">
                    {item.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    Quantity: {item.quantity}
                  </p>
                </div>

                <p className="font-semibold">
                  ₹{(
                    item.price * item.quantity
                  ).toLocaleString("en-IN")}
                </p>
              </div>
            ))}

            <div className="mt-6 flex justify-between">
              <span>Total Items</span>
              <span>{totalItems}</span>
            </div>

            <div className="mt-4 flex justify-between text-xl font-bold text-blue-600">
              <span>Estimated Total</span>
              <span>
                ₹{totalPrice.toLocaleString("en-IN")}
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Final amount is calculated using database prices.
            </p>

            <Link
              href="/cart"
              className="mt-6 inline-block text-blue-600 hover:underline"
            >
              ← Back to Cart
            </Link>
          </section>

          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-6 text-2xl font-bold">
              Delivery Information
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block font-medium">
                  Full Name
                </label>

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
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
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">
                  Delivery Address
                </label>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your complete delivery address"
                  rows={4}
                  required
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isLoading ? "Placing Order..." : "Place Order"}
              </button>

              {message && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
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
