import { Header } from './_components/header';
import { Feed } from './_components/feed';
import { AlgorithmPanelPortal } from './_components/algorithm-panel-portal';

export default function V2Page() {
  return (
    <>
      <Header />
      <Feed />
      <AlgorithmPanelPortal />
    </>
  );
}
