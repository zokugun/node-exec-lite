export function combineSignals(signals: AbortSignal[]): AbortSignal {
	const controller = new AbortController();

	for(const signal of signals) {
		if(signal.aborted) {
			controller.abort();

			return signal;
		}

		const onAbort = (): void => {
			controller.abort(signal.reason);
		};

		signal.addEventListener('abort', onAbort, {
			signal: controller.signal,
		});
	}

	return controller.signal;
}
