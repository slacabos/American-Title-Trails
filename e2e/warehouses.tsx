import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, _roots } from "@react-three/fiber";
import { Daylight, Follower, Scenery, SceneryProvider } from "../src/components/three/Scenery";
import { warehouseExamples } from "../src/test/fixtures/warehouseExamples";
import { warehouseLayout } from "../src/rendering/warehouseLayout";
import { featureAnchor } from "../src/rendering/tileLayout";

const example = warehouseExamples[Number(new URLSearchParams(location.search).get("example") ?? 0)];
Object.assign(window, {
  warehouseTest: {
    stats: () => {
      const canvas = document.querySelector("canvas")!;
      const state = _roots.get(canvas)!.store.getState();
      return { frame: state.gl.info.render.frame, calls: state.gl.info.render.calls, geometries: state.gl.info.memory.geometries };
    },
  },
});
function Review() {
  const [count, setCount] = useState(example.records.length);
  const records = example.records.slice(0, count);
  const layout = warehouseLayout(records);
  const xs = example.records.map((record) => record.position.x);
  const zs = example.records.map((record) => record.position.y);
  const center = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2];
  return <main style={{ font: "16px Arial, sans-serif", color: "#30443b", width: 1100 }}>
    <h1>{example.name}</h1>
    <p><span data-testid="sections">{count}</span> tiles · <span data-testid="complexes">{layout.length}</span> connected complexes</p>
    <button disabled={count === 1} onClick={() => setCount(count - 1)}>Remove tile</button>
    <button disabled={count === example.records.length} onClick={() => setCount(count + 1)}>Add tile</button>
    <div style={{ height: 650, background: "#eee9dd" }}>
      <Canvas orthographic shadows frameloop="demand" dpr={1}
        camera={{ position: [center[0] + 6, 10.1, center[1] + 6], zoom: 225 }}
        onCreated={({ camera }) => camera.lookAt(center[0], 0, center[1])}>
        <Daylight />
        <SceneryProvider><Scenery records={records} /></SceneryProvider>
        {records.flatMap((record) => record.tile.costcoZones.map((_, i) => {
          const [x, z] = featureAnchor(record.tile, { type: "costco", identifier: `costco_${i}` });
          return <Follower key={`${record.position.x},${record.position.y}:${i}`}
            point={[record.position.x + x, 0.012, record.position.y + z]} color="#437eaf" />;
        }))}
      </Canvas>
    </div>
  </main>;
}
createRoot(document.getElementById("root")!).render(<Review />);
