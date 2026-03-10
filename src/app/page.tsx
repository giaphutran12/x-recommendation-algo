import Header from '@/components/header';
import { Feed, AlgorithmPanelPortal } from '@/components/feed';

export default function HomePage() {
  return (
    <>
      <Header />
      <Feed />
      <AlgorithmPanelPortal />
    </>
  );
}
