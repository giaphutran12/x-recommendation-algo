import { Header } from './_components/header';
import { Feed } from './_components/feed';
import { AlgorithmPanel } from './_components/algorithm-panel';

export default function V4Page() {
  return (
    <>
      <div className="flex flex-col">
        <Header />
        <Feed />
      </div>
      <AlgorithmPanel />
    </>
  );
}
