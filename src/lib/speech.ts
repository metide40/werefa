/**
 * Browser SpeechRecognition helper for Werfa.
 * Uses Web Speech API when available; otherwise returns unsupported.
 */

export type SpeechLang = 'en' | 'am' | 'om';

const LANG_MAP: Record<SpeechLang, string> = {
  en: 'en-US',
  am: 'am-ET',
  om: 'om-ET', // may fall back if browser lacks Oromo model
};

export type SpeechSupport = {
  supported: boolean;
  reason?: string;
};

export function getSpeechSupport(): SpeechSupport {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Not in a browser environment' };
  }
  const SR =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) {
    return {
      supported: false,
      reason: 'Speech recognition is not supported in this browser',
    };
  }
  return { supported: true };
}

export type ListenResult = {
  transcript: string;
  simulated: boolean;
};

export function startListening(
  lang: SpeechLang,
  onResult: (result: ListenResult) => void,
  onError: (message: string) => void,
  onEnd: () => void
): { stop: () => void; simulated: boolean } {
  const support = getSpeechSupport();
  if (!support.supported) {
    // Caller should show simulation UI — do not pretend recognition worked
    onError(support.reason || 'Unsupported');
    onEnd();
    return { stop: () => {}, simulated: true };
  }

  const SR =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SR();
  recognition.lang = LANG_MAP[lang] || 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    onResult({ transcript: transcript.trim(), simulated: false });
  };
  recognition.onerror = (event: any) => {
    const code = event?.error || 'error';
    if (code === 'not-allowed') {
      onError('Microphone permission denied');
    } else if (code === 'no-speech') {
      onError('No speech detected');
    } else {
      onError(`Speech recognition error: ${code}`);
    }
  };
  recognition.onend = () => onEnd();

  try {
    recognition.start();
  } catch (e: any) {
    onError(e?.message || 'Could not start microphone');
    onEnd();
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
    simulated: false,
  };
}
