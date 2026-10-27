// Сгенерировано scripts/routes.mjs — не править руками.
import View, { meta, staticParams } from "@/views/project";

export const dynamicParams = false;
export function generateStaticParams() {
  return staticParams();
}

type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) {
  return meta("ky", await params);
}
export default async function Page({ params }: P) {
  return <View locale="ky" params={await params} />;
}
