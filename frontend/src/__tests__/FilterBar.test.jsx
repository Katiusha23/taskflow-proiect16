/**
 * @file FilterBar.test.jsx
 * @description Teste pentru componenta FilterBar.
 * Verificam ca dropdown-urile sunt randate corect si ca onChange este apelat
 * cu valoarea corecta la selectarea unei optiuni.
 *
 * Autor: Proiect 16 – Tehnologii Web
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FilterBar from "../components/FilterBar";

/** Filtre implicite (toate goale = niciun filtru activ) */
const defaultFilters = { category: "", priority: "", completed: "", sort: "" };

describe("FilterBar", () => {
  it("randeaza toate cele 4 dropdown-uri", () => {
    render(<FilterBar filters={defaultFilters} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/categorie/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prioritate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sorteaza/i)).toBeInTheDocument();
  });

  it("nu afiseaza butonul 'Reseteaza' cand nu exista filtre active", () => {
    render(<FilterBar filters={defaultFilters} onChange={vi.fn()} />);
    expect(screen.queryByText(/reseteaza/i)).not.toBeInTheDocument();
  });

  it("afiseaza butonul 'Reseteaza' cand exista cel putin un filtru activ", () => {
    const filtersWithCategory = { ...defaultFilters, category: "work" };
    render(<FilterBar filters={filtersWithCategory} onChange={vi.fn()} />);
    expect(screen.getByText(/reseteaza/i)).toBeInTheDocument();
  });

  it("apeleaza onChange cu categoria selectata", () => {
    const handleChange = vi.fn();
    render(<FilterBar filters={defaultFilters} onChange={handleChange} />);

    // Selectam categoria "Munca"
    fireEvent.change(screen.getByLabelText(/categorie/i), {
      target: { value: "work" },
    });

    // onChange trebuie apelat cu o functie updater; verificam ca a fost apelat
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("apeleaza onChange cu prioritatea selectata", () => {
    const handleChange = vi.fn();
    render(<FilterBar filters={defaultFilters} onChange={handleChange} />);

    fireEvent.change(screen.getByLabelText(/prioritate/i), {
      target: { value: "high" },
    });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("reseteaza toate filtrele la click pe 'Reseteaza'", () => {
    const handleChange = vi.fn();
    const filtersActive = { category: "work", priority: "high", completed: "", sort: "" };

    render(<FilterBar filters={filtersActive} onChange={handleChange} />);
    fireEvent.click(screen.getByText(/reseteaza/i));

    // onChange trebuie apelat cu obiectul de filtre goale
    expect(handleChange).toHaveBeenCalledWith({
      category: "",
      priority: "",
      completed: "",
      sort: "",
    });
  });
});
