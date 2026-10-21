import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { initialState, withBriefings, type State } from "./model";
export type Modal = { type: string; id?: string; tab?: string };
type Store = {
  s: State;
  update: (fn: (s: State) => State) => void;
  modal: Modal | null;
  open: (type: string, id?: string, tab?: string) => void;
  close: () => void;
  notify: (message: string) => void;
  toast: string;
  page: string;
  go: (page: string) => void;
};
const Context = createContext<Store>(null!);
const pages = [
  "overview",
  "customers",
  "records",
  "network",
  "actions",
  "calendar",
  "settings",
];
const getPage = () =>
  pages.includes(location.hash.slice(1)) ? location.hash.slice(1) : "overview";
function load() {
  try {
    const raw = localStorage.getItem("flipside-react-v1");
    if (!raw) return initialState();
    const saved = JSON.parse(raw);
    if (
      !Array.isArray(saved.customers) ||
      !Array.isArray(saved.records) ||
      !Array.isArray(saved.meetings) ||
      !Array.isArray(saved.history)
    )
      return initialState();
    return { ...initialState(), ...saved } as State;
  } catch {
    return initialState();
  }
}
export function Provider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(load),
    [modal, setModal] = useState<Modal | null>(null),
    [toast, notify] = useState(""),
    [page, setPage] = useState(getPage);
  useEffect(() => {
    try {
      localStorage.setItem("flipside-react-v1", JSON.stringify(s));
    } catch {
      notify("브라우저 저장 공간이 부족해 변경 사항을 저장하지 못했어요.");
    }
  }, [s]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => notify(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const fn = () => setPage(getPage());
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setModal({ type: "search" });
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  const update = (fn: (s: State) => State) =>
    setS((previous) => withBriefings(fn(previous)));
  const go = (p: string) => {
    location.hash = p;
    setPage(p);
    setModal(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <Context.Provider
      value={{
        s,
        update,
        modal,
        open: (type, id, tab) => setModal({ type, id, tab }),
        close: () => setModal(null),
        notify,
        toast,
        page,
        go,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
