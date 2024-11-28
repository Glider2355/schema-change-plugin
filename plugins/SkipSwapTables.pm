package pt_online_schema_change_plugin;

sub new {
    my ($class, %args) = @_;
    return bless {}, $class;
}

sub before_swap_tables {
    my ($self, %args) = @_;
    print "Skipping table swap...\n";
    die "Swap tables is disabled by plugin.\n";
}

1;
