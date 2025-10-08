import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Dashboard
        </Link>{' '}
        <Link to="/quotes" className="[&.active]:font-bold">
          Quotes
        </Link>{' '}
        {/* <Link to="/characters" className="[&.active]:font-bold">
          Characters
        </Link>{' '}
        <Link to="/gallery" className="[&.active]:font-bold">
          Gallery
        </Link>{' '}
        <Link to="/perks" className="[&.active]:font-bold">
          Perks
        </Link> */}
      </div>
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})