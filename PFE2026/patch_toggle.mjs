import { readFileSync, writeFileSync } from "fs";
const path = "C:/e com/frontend2/app/admin/orders/page.tsx";
let src = readFileSync(path, "utf8");

src = src.replace(
  /async function handleClick[\s\S]*?}\s*}/,
  `async function handleClick(step: { key: string }) {
    if (loading) return;
    let newStatus: string;
    if (step.key === order.status) {
      // uncheck: each step reverts to the one before it
      const prev: Record<string,string> = {
        CONFIRMED:  "PENDING",
        ON_THE_WAY: "CONFIRMED",
        DELIVERED:  "ON_THE_WAY",
      };
      newStatus = prev[step.key] ?? "PENDING";
    } else {
      // only allow clicking the immediate next step
      const nextIdx = STATUS_ORDER.indexOf(order.status) + 1;
      if (STATUS_ORDER.indexOf(step.key) !== nextIdx) return;
      newStatus = step.key;
    }
    setLoading(true);
    try {
      await api.patch(\`/api/admin/orders/\${order.id}/status\`, { status: newStatus });
      onUpdate(order.id, newStatus);
    } finally {
      setLoading(false);
    }
  }`
);

writeFileSync(path, src, "utf8");
console.log("done");
