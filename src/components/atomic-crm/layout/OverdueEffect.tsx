import { useEffect, useMemo } from "react";
import { useGetList } from "ra-core";

interface Todo {
  id: number;
  text: string;
  done: boolean;
  due_date?: string | null;
}

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * OverdueEffect — screen inversion that intensifies with overdue todo count.
 *
 * Queries all todos, counts how many are overdue (not done, due_date < today),
 * and applies a data-overdue-level attribute + CSS class on document.body.
 *
 * Purely visual — no interaction needed. The CSS in index.css handles the
 * crimson gradient / pulse overlay via a fixed ::after pseudo-element.
 */
export const OverdueEffect = () => {
  const { data: todos } = useGetList<Todo>("todos", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "created_at", order: "DESC" },
  });

  const overdueCount = useMemo(() => {
    if (!todos) return 0;
    const today = localToday();
    return todos.filter(
      (t) => !t.done && t.due_date && t.due_date < today,
    ).length;
  }, [todos]);

  useEffect(() => {
    const body = document.body;

    // Remove any previous level classes
    body.classList.remove("overdue-subtle", "overdue-medium", "overdue-severe");

    if (overdueCount === 0) return;

    const level =
      overdueCount >= 8
        ? "overdue-severe"
        : overdueCount >= 4
          ? "overdue-medium"
          : "overdue-subtle";

    body.classList.add(level);

    return () => {
      body.classList.remove("overdue-subtle", "overdue-medium", "overdue-severe");
    };
  }, [overdueCount]);

  return null;
};
