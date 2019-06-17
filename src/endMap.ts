import { Observable, concat, defer } from 'rxjs';
import { tap } from 'rxjs/operators';

function endMap<T>(project: (value: T) => Observable<T>) {
  return (source$: Observable<T>) => {
    let lastValue: T;

    return concat(
      source$.pipe(
        tap((value) => {
          lastValue = value;
        }),
      ),
      defer(() => project(lastValue)),
    );
  };
}

export default endMap;
