"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoading } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login?redirect=/org");
    }
  }, [isAuthLoading, user, router]);

  if (isAuthLoading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#030712" }}>
      <div style={{ width:32, height:32, border:"4px solid #10b981", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return null;

  return <>{children}</>;
}
