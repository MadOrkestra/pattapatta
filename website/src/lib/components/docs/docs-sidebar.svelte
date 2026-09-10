<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { navGroups } from '$lib/nav';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import {
		Sidebar,
		SidebarContent,
		SidebarGroup,
		SidebarGroupContent,
		SidebarGroupLabel,
		SidebarHeader,
		SidebarMenu,
		SidebarMenuButton,
		SidebarMenuItem,
		SidebarRail,
	} from '$lib/components/ui/sidebar/index.js';
</script>

<Sidebar>
	<SidebarHeader>
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton size="lg" isActive={page.url.pathname === '/'}>
					{#snippet child({ props })}
						<a href={resolve('/')} {...props}>
							<span class="truncate font-semibold tracking-tight">pattapatta</span>
						</a>
					{/snippet}
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	</SidebarHeader>
	<SidebarContent>
		<ScrollArea class="h-full">
			{#each navGroups as group (group.title)}
				<SidebarGroup>
					<SidebarGroupLabel>{group.title}</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{#each group.items as item (item.href)}
								<SidebarMenuItem>
									<SidebarMenuButton isActive={page.url.pathname === item.href}>
										{#snippet child({ props })}
											<a href={resolve(item.href as '/')} {...props}>
												<span>{item.title}</span>
											</a>
										{/snippet}
									</SidebarMenuButton>
								</SidebarMenuItem>
							{/each}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			{/each}
		</ScrollArea>
	</SidebarContent>
	<SidebarRail />
</Sidebar>
