import Combine

extension Publisher {
	func retryWithDelay<S>(
		retries: Int,
		delay: S.SchedulerTimeType.Stride,
		scheduler: S
	) -> AnyPublisher<Output, Failure> where S: Scheduler {
		self
			.delayIfFailure(for: delay, scheduler: scheduler)
			.retry(retries)
			.eraseToAnyPublisher()
	}

	private func delayIfFailure<S>(
		for delay: S.SchedulerTimeType.Stride,
		scheduler: S
	) -> AnyPublisher<Output, Failure> where S: Scheduler {
		self.catch { error in
			Future { completion in
				scheduler.schedule(after: scheduler.now.advanced(by: delay)) {
					completion(.failure(error))
				}
			}
		}
		.eraseToAnyPublisher()
	}
}
