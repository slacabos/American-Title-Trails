// Example usage of translations in GameSetup.tsx
//
// Replace hardcoded strings with:

// import useTranslations from '../hooks/useTranslations';

// In the component:
// const { t } = useTranslations();

// Usage examples:
//
// OLD: "Game Setup"
// NEW: {t('setup.gameSetup')}
//
// OLD: "Number of players (2-5):"
// NEW: {t('setup.numberOfPlayers')}
//
// OLD: "Start Game"
// NEW: {t('setup.startGame')}
//
// OLD: `Player ${index + 1}`
// NEW: {t('setup.defaultPlayerNameTemplate', { number: index + 1 })}
//
// OLD: "Human" / "AI"
// NEW: {t('setup.playerTypes.human')} / {t('setup.playerTypes.ai')}
//
// OLD: "📖 How to Play"
// NEW: {t('setup.howToPlay')}

export default {};
