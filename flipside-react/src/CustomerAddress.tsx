import { useEffect, useState, type FormEvent } from "react";
import { Check, MapPin, Search } from "lucide-react";
import { useStore } from "./store";
import {
  cardLocation,
  loadMapIndex,
  matchAddress,
  regionTrail,
  type MapIndex,
} from "./geography";
import type { Customer } from "./model";

export default function CustomerAddress({ customer }: { customer: Customer }) {
  const { update, notify } = useStore();
  const original = cardLocation(customer);
  const [address, setAddress] = useState(original?.address || "");
  const [code, setCode] = useState(original?.regionCode || "");
  const [index, setIndex] = useState<MapIndex>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    loadMapIndex()
      .then((data) => {
        if (active) setIndex(data);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const regions = index?.regions || [];
  const trail = regionTrail(code, regions);
  function find() {
    const region = matchAddress(address, regions);
    if (region) {
      setCode(region.code);
      setMessage(
        `${region.fullName}을 찾았어요. 실제 명함 주소와 일치하는지 확인해주세요.`,
      );
    } else
      setMessage(
        "주소만으로 행정구역을 확정할 수 없어요. 아래에서 시·도, 시·군·구, 읍·면·동을 선택해주세요.",
      );
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (!address.trim() || trail.at(-1)?.level !== 3) return;
    update((s) => ({
      ...s,
      customers: s.customers.map((c) =>
        c.id === customer.id
          ? {
              ...c,
              location: {
                address: address.trim(),
                regionCode: code,
                demo:
                  original?.demo &&
                  address.trim() === original.address &&
                  code === original.regionCode,
              },
            }
          : c,
      ),
    }));
    setMessage("저장했습니다. 관계 지도가 이 주소의 행정구역으로 연결됩니다.");
    notify("명함 주소와 지도 위치를 저장했어요.");
  }
  return (
    <form className="address-form" onSubmit={save}>
      <div className="address-intro">
        <MapPin size={23} />
        <div>
          <h3>명함 주소를 관계 지도에 연결하기</h3>
          <p>
            명함에 적힌 주소를 입력하고, 주소가 속한 행정구역을 확인해주세요.
          </p>
        </div>
      </div>
      {original?.demo && (
        <p className="address-demo">
          현재 주소는 화면 시연용 예시입니다. 고객사의 실제 소재지가 아닙니다.
        </p>
      )}
      <label className="field">
        <span>명함 주소</span>
        <textarea
          aria-label="명함 주소"
          value={address}
          maxLength={200}
          required
          rows={2}
          placeholder="예: 서울특별시 강남구 테헤란로 152 (역삼동)"
          onChange={(e) => {
            setAddress(e.target.value);
            setCode("");
            setMessage(
              "주소를 변경했어요. 연결할 행정구역을 다시 확인해주세요.",
            );
          }}
        />
      </label>
      <button
        type="button"
        className="btn"
        disabled={!index || !address.trim()}
        onClick={find}
      >
        <Search size={15} />
        주소에서 지역 찾기
      </button>
      {error ? (
        <p role="alert">
          지역 목록을 불러오지 못했어요.{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => setRetry((n) => n + 1)}
          >
            다시 시도
          </button>
        </p>
      ) : !index ? (
        <p role="status">행정구역 목록을 불러오고 있어요…</p>
      ) : (
        <div className="address-selects">
          <label>
            시·도
            <select
              aria-label="주소 시·도"
              value={trail[0]?.code || ""}
              required
              onChange={(e) => {
                setCode(e.target.value);
                setMessage("");
              }}
            >
              <option value="">선택해주세요</option>
              {regions
                .filter((r) => r.level === 1)
                .map((r) => (
                  <option value={r.code} key={r.code}>
                    {r.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            시·군·구
            <select
              aria-label="주소 시·군·구"
              disabled={!trail[0]}
              value={trail[1]?.code || ""}
              required
              onChange={(e) => {
                setCode(e.target.value || trail[0].code);
                setMessage("");
              }}
            >
              <option value="">선택해주세요</option>
              {regions
                .filter((r) => r.parent === trail[0]?.code)
                .map((r) => (
                  <option value={r.code} key={r.code}>
                    {r.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            읍·면·동
            <select
              aria-label="주소 읍·면·동"
              disabled={!trail[1]}
              value={trail[2]?.code || ""}
              required
              onChange={(e) => {
                setCode(e.target.value || trail[1].code);
                setMessage("");
              }}
            >
              <option value="">선택해주세요</option>
              {regions
                .filter((r) => r.parent === trail[1]?.code)
                .map((r) => (
                  <option value={r.code} key={r.code}>
                    {r.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}
      <p className="address-note">
        도로명주소와 법정동은 행정동과 다를 수 있어요. 자동 검색은 행정구역명이
        명확히 일치할 때만 연결하며, 지도 핀은 건물이 아닌 읍·면·동의 대표
        위치에 표시됩니다.
      </p>
      {message && (
        <p className="address-message" role="status">
          {message}
        </p>
      )}
      <div className="dialog-footer">
        <button
          type="button"
          className="btn"
          onClick={() => {
            update((s) => ({
              ...s,
              customers: s.customers.map((c) =>
                c.id === customer.id ? { ...c, location: null } : c,
              ),
            }));
            setAddress("");
            setCode("");
            setMessage(
              "주소 연결을 해제했습니다. 위치 미등록 목록에서 확인할 수 있어요.",
            );
          }}
        >
          주소 연결 해제
        </button>
        <button
          className="btn primary"
          disabled={!address.trim() || trail.at(-1)?.level !== 3}
        >
          <Check size={16} />
          주소 저장
        </button>
      </div>
    </form>
  );
}
