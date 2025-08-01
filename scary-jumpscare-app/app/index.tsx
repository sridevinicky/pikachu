import dynamic from "next/dynamic";

const FaceCheck = dynamic(() => import("../components/FaceCheck"), { ssr: false });

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl text-center font-bold my-6">🔪 Face The Toaster</h1>
      <FaceCheck />
    </div>
  );
}
