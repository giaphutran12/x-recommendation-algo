import { Header } from './_components/header';
import { Feed } from './_components/feed';
import { AlgorithmPanelPortal } from './_components/algorithm-panel';

export default function V1Page() {
  return (
    <>
      <Header />
      <Feed />
      <AlgorithmPanelPortal />
    </>
  );
}
