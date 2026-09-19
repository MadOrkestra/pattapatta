<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { navGroups } from '$lib/nav';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import {
		Sidebar,
		SidebarContent,
		SidebarFooter,
		SidebarGroup,
		SidebarGroupContent,
		SidebarGroupLabel,
		SidebarHeader,
		SidebarMenu,
		SidebarMenuButton,
		SidebarMenuItem,
	} from '$lib/components/ui/sidebar/index.js';
</script>

<Sidebar collapsible="none">
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
	<SidebarFooter>
		<p class="text-muted-foreground px-2 text-xs leading-relaxed">
			AI-built experiment — not for production yet.
			<a
				class="text-foreground underline-offset-2 hover:underline"
				href="https://github.com/MadOrkestra/pattapatta"
				target="_blank"
				rel="noopener noreferrer"
			>GitHub</a>
			·
			<a
				class="text-foreground underline-offset-2 hover:underline"
				href="https://github.com/MadOrkestra/pattapatta/issues"
				target="_blank"
				rel="noopener noreferrer"
			>Issues</a>
		</p>
	</SidebarFooter>
</Sidebar>
