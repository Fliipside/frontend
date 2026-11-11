import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useStore } from "./store";
import "./card-photo.css";
import type { Customer } from "./model";

const maxPhotoBytes = 10 * 1024 * 1024;
// shortcut: the photo is shrunk and kept in this browser only; send the original to the server once an upload API exists.
async function shrink(file: File, max = 1200) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function CardPhoto({ customer }: { customer: Customer }) {
  const { update, notify } = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const save = (cardImage: string | null) =>
    update((s) => ({
      ...s,
      customers: s.customers.map((c) =>
        c.id === customer.id ? { ...c, cardImage } : c,
      ),
    }));
  async function pick(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return setError("사진 파일만 올릴 수 있어요.");
    if (file.size > maxPhotoBytes)
      return setError("10MB 이하 사진만 올릴 수 있어요.");
    try {
      save(await shrink(file));
      setError("");
      notify("명함 사진을 저장했어요.");
    } catch {
      setError("이 사진을 열 수 없어요. JPG나 PNG로 올려주세요.");
    }
  }
  return (
    <section className="card-photo">
      <h3>명함 사진</h3>
      {customer.cardImage ? (
        <img src={customer.cardImage} alt={`${customer.person} 명함`} />
      ) : (
        <p>명함을 찍은 사진을 올려주세요.</p>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="card-photo-actions">
        <button
          type="button"
          className="btn"
          onClick={() => input.current?.click()}
        >
          <Camera size={15} />
          {customer.cardImage ? "사진 바꾸기" : "사진 올리기"}
        </button>
        {customer.cardImage && (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              save(null);
              notify("명함 사진을 삭제했어요.");
            }}
          >
            사진 삭제
          </button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
