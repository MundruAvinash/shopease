
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

interface Profile {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
}

async function ProfileContent() {
  // Step 1: Verify the logged-in user
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Step 2: Fetch fresh profile information from MySQL
  const [rows] = await db.execute(
    `SELECT id, name, email, role
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [currentUser.userId]
  );

  const profiles = rows as Profile[];
  const profile = profiles[0];

  if (!profile) {
    redirect("/login");
  }

  // Step 3: Render the profile on the server
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-lg rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-3xl font-bold text-blue-600">
          SSR Profile
        </h1>

        <div className="space-y-4">
          <p>
            <strong>User ID:</strong> {profile.id}
          </p>

          <p>
            <strong>Name:</strong> {profile.name}
          </p>

          <p>
            <strong>Email:</strong> {profile.email}
          </p>

          <p>
            <strong>Role:</strong> {profile.role}
          </p>
        </div>
      </div>
    </main>
  );
}

export default function SSRProfilePage() {
  return (
    <Suspense fallback={<p className="p-8">Loading profile...</p>}>
      <ProfileContent />
    </Suspense>
  );
}
