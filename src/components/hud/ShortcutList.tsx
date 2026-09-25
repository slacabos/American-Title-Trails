import { SHORTCUTS } from "@/rendering/keyboard";
import useTranslations from "@/hooks/useTranslations";

/** Every keyboard shortcut, from the same table the game reads. */
export function ShortcutList() {
  const { t } = useTranslations();
  return (
    <section aria-labelledby="shortcut-list-title" className="shortcut-list">
      <h2 id="shortcut-list-title">{t("shortcuts.title")}</h2>
      <dl>
        {SHORTCUTS.map(({ keys, action }) => (
          <div key={action}>
            <dt>
              {keys.map((key) => (
                <kbd key={key}>{key}</kbd>
              ))}
            </dt>
            <dd>{t(action)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default ShortcutList;
