import { SHORTCUT_GROUPS } from "@/rendering/keyboard";
import useTranslations from "@/hooks/useTranslations";

/** Every keyboard shortcut, grouped, from the same table the game reads. */
export function ShortcutList() {
  const { t } = useTranslations();
  return (
    <section aria-labelledby="shortcut-list-title" className="shortcut-list">
      <h2 id="shortcut-list-title">{t("shortcuts.title")}</h2>
      <div className="shortcut-groups">
        {SHORTCUT_GROUPS.map(({ title, shortcuts }) => (
          <div key={title} className="shortcut-group">
            <h3>{t(title)}</h3>
            <dl>
              {shortcuts.map(({ keys, modifier, action }) => (
                <div key={action}>
                  <dt>
                    {modifier && (
                      <span className="shortcut-modifier">
                        <kbd>{modifier}</kbd>
                        <span aria-hidden="true">+</span>
                      </span>
                    )}
                    <span className="shortcut-lines">
                      {keys.map((line) => (
                        <span key={line.join()} className="shortcut-line">
                          {line.map((key) => (
                            <kbd key={key}>{key}</kbd>
                          ))}
                        </span>
                      ))}
                    </span>
                  </dt>
                  <dd>{t(action)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ShortcutList;
