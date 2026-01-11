# FRONTEND TEMPLATE REACT + JS
It has some packages already installed, those packages includes:
- [React TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides) - For Data fetching and Mutation
- [React Router](https://reactrouter.com/web/guides/quick-start) - For Routing
- [React Redux](https://redux.js.org/introduction/getting-started) - For Complex  State Management
- [Ant Design](https://ant.design/components/overview) - For UI Components
- [React Toastify](https://fkhadra.github.io/react-toastify/introduction) - For Toast Notification
- [React Icons](https://react-icons.github.io/react-icons/) - For Icons source
- [Heroicons](https://heroicons.com/) - For Icons source
- [Tailwind CSS](https://tailwindcss.com/docs) - For Styling

## PRINCIPLES AND PATTERNS

Here’s a more detailed explanation of each principle and pattern used in the project, followed by the commands for organizing the codebase effectively.

---

### **Frontend Template Project Principles and Patterns**

1. **Atomic Design**:
    - The project is structured following the Atomic Design methodology by Brad Frost, which organizes UI components into five distinct levels: Atoms, Molecules, Organisms, Templates, and Pages.
    - **Atoms** are the most basic components, like buttons or input fields, which can’t be broken down further.
    - **Molecules** combine atoms to create more complex elements, like a search bar made up of an input field and a button.
    - **Components** group molecules and atoms to form distinct sections of a page, like a navigation bar or a footer.
    - **Pages** are the highest-level components, using templates to provide actual content, creating fully realized screens.
    - This structure promotes reusability and modularity by keeping components well-organized and easy to locate.

2. **Functional Programming**:
    - The project emphasizes functional programming, using **functional components** and **hooks** instead of class components.
    - Functional programming helps keep the code pure and predictable by avoiding side effects within components. React’s hooks, such as `useState`, `useEffect`, and custom hooks, are heavily utilized to manage state and lifecycle methods.
    - This approach encourages clean, maintainable code and avoids common pitfalls associated with shared state and complex lifecycles.

3. **TypeScript**:
    - Using TypeScript enables static typing, helping developers catch errors at compile time rather than at runtime.
    - It enhances code readability, provides robust autocomplete suggestions, and improves maintainability by defining types for components, props, and data models.
    - This typing helps prevent bugs, reduces runtime errors, and creates a more reliable codebase.

4. **React Query**:
    - React Query manages server-side data caching, synchronization, and fetching.
    - With a **cache-first approach**, React Query reduces the need to fetch the same data repeatedly, leading to faster load times and less network overhead.
    - React Query handles background updates, cache invalidation, and synchronization, which simplifies complex state management for remote data.

5. **Separation of Concerns**:
    - Each part of the application is designed with a **single responsibility** principle. Components, containers, utilities, pages, or modules are only responsible for a specific task or part of the application’s functionality.
    - This clear division makes the application easier to maintain, test, and scale by keeping each module focused and independent of others.

6. **Custom Hooks**:
    - Custom hooks encapsulate logic that can be reused across different components.
    - Instead of duplicating code or using complex prop drilling, custom hooks keep business logic modular and reusable.
    - This keeps components lean by moving side effects and shared logic into separate, easily maintainable hooks.

7. **S.O.L.I.D Principles**:
    - The **SOLID** principles are design guidelines aimed at improving code maintainability and scalability:
        - **Single Responsibility Principle (SRP)**: Each component, function, or class should have only one reason to change.
        - **Open-Closed Principle (OCP)**: The code should be open for extension but closed for modification, meaning you can extend functionality without changing existing code.
        - **Liskov Substitution Principle (LSP)**: Subclasses or derived components should be substitutable for their base types.
        - **Interface Segregation Principle (ISP)**: Components should only depend on methods and properties they actually use, keeping interfaces specific and relevant.
        - **Dependency Inversion Principle (DIP)**: High-level modules should not depend on low-level modules; instead, both should rely on abstractions.

---

### **Getting Started: Useful Commands for Project Management**

Organize the codebase with the following useful commands. This systematized approach ensures consistency across the app and enforces structure and clarity.

- **Lint & Fix**: `npm run lint` - Runs ESLint to analyze code for syntax errors and apply fixes to improve consistency.
- **Format & Fix**: `npm run format` - Formats the code with Prettier to standardize code style across the project.
- **Create Page**: `npm run create:page <PageName> <PagePath>` - Generates a new page component.
- **Create Component**: `npm run create:component <ComponentName> <ComponentPath>` - Generates a new reusable component.
- **Create Container**: `npm run create:container <ContainerName> <ContainerPath>` - Generates a container component, ideal for managing complex state or business logic.
- **Create Module**: `npm run create:module <ModuleName> <ModulePath>` - Generates a module, often grouping related features or state.
- **Create Hook**: `npm run create:hook <HookName> <HookPath>` - Creates a reusable custom hook.
- **Create Atom**: `npm run create:atom <AtomName> <AtomPath>` - Creates an atomic-level component, such as a button or text input.
- **Create Slice**: `npm run create:slice <SliceName> <SlicePath>` - Generates a slice for managing state with Redux.
- **Create Layout**: `npm run create:layout <LayoutName> <LayoutPath>` - Sets up a new layout, organizing the structure of pages.
- **Create Route**: `npm run create:route <RouteName> <RoutePath>` - Adds a new route to the application.
- **Create Molecule**: `npm run create:molecule <MoleculeName> <MoleculePath>` - Creates a molecule component, combining atoms to build more complex UI elements.

---

These practices and commands help maintain a clear, consistent structure across the codebase, making it easier to navigate, extend, and debug. They also enforce principles that prioritize reusability, maintainability, and performance.

#### CREATE MODULE

```bash
npm run create:module <ModuleName> <ModulePath>
```

Output:

```
|-- src
    |-- modules
        |-- <ModuleName>
            |-- Pages
            |-- Components
            |-- Containers
            |-- Hooks
            |-- index.js or index.js
            |-- routes
            |-- slices
            |-- layout
```

#### CREATE PAGE

```bash
npm run create:page <PageName> <PagePath>
```

Output:

```doc
|-- src
    |-- modules
        |-- <ModuleName>
            |-- Pages
                |-- <PageName>
                    |-- page.tsx
                    |-- index.js or index.js
                    |-- components
                    |-- containers
                    |-- hooks
```

#### CREATE COMPONENT

```bash
npm run create:component <ComponentName> <ComponentPath>
```

Output:

```doc
 |-- components
    |-- <ComponentName>.tsx or <ComponentName>.jsx
    |-- index.js or index.js
```

#### CREATE CONTAINER

```bash
npm run create:container <ContainerName> <ContainerPath>
```

Output:

```doc
 |-- containers
    |-- <ContainerName>.tsx or <ContainerName>.jsx
    |-- index.js or index.js
```

#### CREATE HOOK

```bash
npm run create:hook <HookName> <HookPath>
```

Output:

```doc
 |-- hooks
    |-- use<HookName>.ts
    |-- index.js or index.js
```

#### CREATE ATOM

```bash
npm run create:atom <AtomName> <AtomPath>
```

Output:

```doc
 |-- atoms
    |-- <AtomName>.tsx or <AtomName>.jsx
    |-- index.js or index.js
```

#### CREATE MOLECULE

```bash
npm run create:molecule <MoleculeName> <MoleculePath>
```

Output

```doc
 |-- molecules
    |-- <MoleculeName>.tsx or <MoleculeName>.jsx
    |-- index.js or index.js
```

### PROJECT STRUCTURE

```doc
|-- src
    |-- assets
    |-- library
        |-- components
        |-- atoms
        |-- molecules
        |-- layouts
    |-- services
        |-- api
        |-- hooks
        |-- adapters
        |-- constants
    |-- modules
    |-- utils
    |-- config
|-- scripts
|-- public
|-- .prettierrc
|-- .eslintrc
```
