import { Home } from "@/components/Home";
import { homeMeta } from "@/lib/meta";

export const metadata = homeMeta("en");

export default function Page() {
  return <div lang="en"><Home lang="en" /></div>;
}
