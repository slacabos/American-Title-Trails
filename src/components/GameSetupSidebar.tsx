import React from "react";
import { Button } from "@/components/ui/button";
import useTranslations from "@/hooks/useTranslations";

export interface GameSetupSidebarProps {
  onShowHelp: () => void;
}

const GameSetupSidebar: React.FC<GameSetupSidebarProps> = ({ onShowHelp }) => {
  const { t } = useTranslations();

  return (
    <aside className="relative bg-card backdrop-blur-md border-2 border-accent/30 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl">
      <h1 className="m-0 text-xl text-accent font-game">{t("app.title")}</h1>
      <img
        src="/src/assets/icon.png"
        alt={t("app.gameIcon")}
        className="w-full mx-auto my-2 block rounded-lg shadow-game-sm"
      />
      <p className="m-0 text-xxs opacity-80 leading-tight font-game">
        {t("app.tagline")}
      </p>

      <div className="mt-auto pt-4 border-t border-accent/20">
        <Button
          onClick={onShowHelp}
          variant="outline"
          className="w-full font-game text-xxs"
        >
          {t("setup.howToPlay")}
        </Button>
      </div>
    </aside>
  );
};

export default GameSetupSidebar;
