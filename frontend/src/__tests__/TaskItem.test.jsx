/**
 * @file TaskItem.test.jsx
 * @description Teste pentru componenta TaskItem.
 * Verificam randarea corecta a badge-urilor, indicatorilor de data limita
 * si comportamentul butoanelor de actiune.
 *
 * Autor: Proiect 16 – Tehnologii Web
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import TaskItem from "../components/TaskItem";

/** Wrapper necesar pentru contextul drag & drop */
function DndWrapper({ children, id }) {
  return (
    <DndContext>
      <SortableContext items={[id]}>{children}</SortableContext>
    </DndContext>
  );
}

/** Sarcina de test cu toate campurile completate */
const baseTask = {
  id: "test-1",
  title: "Sarcina de test",
  description: "O descriere a sarcinii",
  category: "work",
  priority: "high",
  dueDate: null,
  completed: false,
  order: 0,
};

/** Randeaza TaskItem in contextul DnD necesar */
function renderTask(task, handlers = {}) {
  const onToggle = handlers.onToggle ?? vi.fn();
  const onEdit   = handlers.onEdit   ?? vi.fn();
  const onDelete = handlers.onDelete ?? vi.fn();

  return render(
    <DndWrapper id={task.id}>
      <TaskItem task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
    </DndWrapper>
  );
}

describe("TaskItem", () => {
  it("afiseaza titlul sarcinii", () => {
    renderTask(baseTask);
    expect(screen.getByText("Sarcina de test")).toBeInTheDocument();
  });

  it("afiseaza descrierea sarcinii", () => {
    renderTask(baseTask);
    expect(screen.getByText("O descriere a sarcinii")).toBeInTheDocument();
  });

  it("afiseaza badge-ul de categorie corect (Munca)", () => {
    renderTask(baseTask);
    expect(screen.getByText("Munca")).toBeInTheDocument();
  });

  it("afiseaza badge-ul de prioritate corecta (Ridicata)", () => {
    renderTask(baseTask);
    expect(screen.getByText("Ridicata")).toBeInTheDocument();
  });

  it("aplica stil 'line-through' pe titlu cand sarcina e finalizata", () => {
    const completedTask = { ...baseTask, completed: true };
    renderTask(completedTask);

    const title = screen.getByText("Sarcina de test");
    expect(title.className).toMatch(/line-through/);
  });

  it("apeleaza onToggle la click pe butonul de completare", () => {
    const onToggle = vi.fn();
    renderTask(baseTask, { onToggle });

    fireEvent.click(screen.getByTitle(/marcheaza ca finalizata/i));
    expect(onToggle).toHaveBeenCalledWith(baseTask);
  });

  it("afiseaza indicatorul de data depasita pentru sarcini expirate", () => {
    const overdueTask = { ...baseTask, dueDate: "2020-01-01" }; // data in trecut
    renderTask(overdueTask);

    expect(screen.getByText(/depasita/i)).toBeInTheDocument();
  });

  it("afiseaza 'Azi!' pentru sarcini cu data limita azi", () => {
    const today = new Date().toISOString().slice(0, 10);
    const todayTask = { ...baseTask, dueDate: today };
    renderTask(todayTask);

    expect(screen.getByText(/azi/i)).toBeInTheDocument();
  });

  it("nu afiseaza indicator de data daca dueDate este null", () => {
    renderTask(baseTask); // dueDate: null
    expect(screen.queryByText(/📅/)).not.toBeInTheDocument();
  });
});
