
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white text-gray-700 transition-colors dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">

        {/* Brand */}
        <div>
          <h2 className="mb-4 text-2xl font-bold text-blue-600">
            ShopEase
          </h2>

          <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
            Your one-stop destination for quality products
            at great prices. Enjoy a simple and convenient
            shopping experience with ShopEase.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Quick Links
          </h3>

          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/" className="hover:text-blue-500">
                Home
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-blue-500">
                Products
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-blue-500">
                Shopping Cart
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-blue-500">
                My Orders
              </Link>
            </li>
          </ul>
        </div>

        {/* My Account */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            My Account
          </h3>

          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/profile" className="hover:text-blue-500">
                My Profile
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-blue-500">
                Login
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-blue-500">
                Register
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="hover:text-blue-500">
                Checkout
              </Link>
            </li>
          </ul>
        </div>

        {/* Shopping Information */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Why Shop With Us?
          </h3>

          <ul className="space-y-3 text-sm">
            <li>✓ Quality Products</li>
            <li>✓ Easy Shopping</li>
            <li>✓ Secure Shopping Experience</li>
            <li>✓ User-Friendly Interface</li>
          </ul>
        </div>

      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-200 px-6 py-5 text-center dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © 2026 ShopEase. All rights reserved.
        </p>
      </div>

    </footer>
  );
}
