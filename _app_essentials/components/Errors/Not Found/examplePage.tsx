import { notFound } from "next/navigation";

export default function ExamplePage() {
  let condition = Math.floor(Math.random() * 2) === 0;
  if (condition) {
    return <div>The page was found!</div>;
  }
  notFound();
}
