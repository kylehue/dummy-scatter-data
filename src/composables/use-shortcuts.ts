import { onMounted, onUnmounted } from "vue";

type Modifier = "ctrl" | "alt" | "shift" | "meta";

type LetterKey =
   | "a"
   | "b"
   | "c"
   | "d"
   | "e"
   | "f"
   | "g"
   | "h"
   | "i"
   | "j"
   | "k"
   | "l"
   | "m"
   | "n"
   | "o"
   | "p"
   | "q"
   | "r"
   | "s"
   | "t"
   | "u"
   | "v"
   | "w"
   | "x"
   | "y"
   | "z";

type DigitKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

type FunctionKey =
   | "f1"
   | "f2"
   | "f3"
   | "f4"
   | "f5"
   | "f6"
   | "f7"
   | "f8"
   | "f9"
   | "f10"
   | "f11"
   | "f12";

type NamedKey =
   | "enter"
   | "escape"
   | "tab"
   | "space"
   | "backspace"
   | "delete"
   | "insert"
   | "home"
   | "end"
   | "pageup"
   | "pagedown"
   | "arrowup"
   | "arrowdown"
   | "arrowleft"
   | "arrowright";

type ShortcutKey = LetterKey | DigitKey | FunctionKey | NamedKey;

type Shortcut =
   | ShortcutKey
   | `${Modifier}+${ShortcutKey}`
   | `${Modifier}+${Modifier}+${ShortcutKey}`
   | `${Modifier}+${Modifier}+${Modifier}+${ShortcutKey}`
   | `${Modifier}+${Modifier}+${Modifier}+${Modifier}+${ShortcutKey}`;

type ShortcutCallback = (event: KeyboardEvent) => void;

type NormalizedShortcut = {
   ctrl: boolean;
   alt: boolean;
   shift: boolean;
   meta: boolean;
   key: ShortcutKey;
};

const MODIFIERS = new Set<Modifier>(["ctrl", "alt", "shift", "meta"]);

function normalizeKey(rawKey: string): ShortcutKey | null {
   const key = rawKey.toLowerCase();

   if (key === " ") return "space";
   if (key === "esc") return "escape";
   if (key === "del") return "delete";
   if (key === "up") return "arrowup";
   if (key === "down") return "arrowdown";
   if (key === "left") return "arrowleft";
   if (key === "right") return "arrowright";

   return key as ShortcutKey;
}

function parseShortcut(shortcut: Shortcut): NormalizedShortcut {
   const parts = shortcut
      .toLowerCase()
      .split("+")
      .map((part) => part.trim())
      .filter(Boolean);

   let key: ShortcutKey | null = null;
   const normalized: NormalizedShortcut = {
      ctrl: false,
      alt: false,
      shift: false,
      meta: false,
      key: "enter",
   };

   for (const part of parts) {
      if (MODIFIERS.has(part as Modifier)) {
         normalized[part as Modifier] = true;
         continue;
      }

      key = normalizeKey(part);
   }

   if (!key) {
      throw new Error(`Shortcut \"${shortcut}\" is missing a key.`);
   }

   normalized.key = key;
   return normalized;
}

function toShortcutId(shortcut: NormalizedShortcut): string {
   return `${shortcut.ctrl ? 1 : 0}:${shortcut.alt ? 1 : 0}:${shortcut.shift ? 1 : 0}:${shortcut.meta ? 1 : 0}:${shortcut.key}`;
}

export function useShortcuts() {
   const callbacks = new Map<string, Set<ShortcutCallback>>();

   function register(shortcut: Shortcut, callback: ShortcutCallback) {
      const parsed = parseShortcut(shortcut);
      const id = toShortcutId(parsed);
      const list = callbacks.get(id) ?? new Set<ShortcutCallback>();
      list.add(callback);
      callbacks.set(id, list);

      return () => {
         const existing = callbacks.get(id);
         if (!existing) return;
         existing.delete(callback);
         if (existing.size === 0) {
            callbacks.delete(id);
         }
      };
   }

   function onKeyDown(event: KeyboardEvent) {
      const key = normalizeKey(event.key);
      if (!key) return;

      const id = toShortcutId({
         ctrl: event.ctrlKey,
         alt: event.altKey,
         shift: event.shiftKey,
         meta: event.metaKey,
         key,
      });

      const handlers = callbacks.get(id);
      if (!handlers) return;

      for (const handler of handlers) {
         handler(event);
      }
   }

   onMounted(() => {
      window.addEventListener("keydown", onKeyDown);
   });

   onUnmounted(() => {
      window.removeEventListener("keydown", onKeyDown);
      callbacks.clear();
   });

   return {
      register,
   };
}

export type { Shortcut, ShortcutCallback };
